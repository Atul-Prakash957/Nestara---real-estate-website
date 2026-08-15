const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { createOtp, verifyOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/mailer');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

async function register(req, res) {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }

    const existing = await query('SELECT id, is_email_verified FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0 && existing.rows[0].is_email_verified) {
      return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let user;
    if (existing.rows.length > 0) {
      const updated = await query(
        `UPDATE users SET name=$1, password_hash=$2, phone=$3 WHERE email=$4 RETURNING *`,
        [name, passwordHash, phone || null, email]
      );
      user = updated.rows[0];
    } else {
      const inserted = await query(
        `INSERT INTO users (name, email, phone, password_hash)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, email, phone || null, passwordHash]
      );
      user = inserted.rows[0];
    }

    const otpCode = await createOtp(email, 'register');
    await sendOtpEmail(email, otpCode, 'register');

    return res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      email,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
}

async function verifyRegisterOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'email and otp are required' });
    }

    const isValid = await verifyOtp(email, otp, 'register');
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const updated = await query(
      `UPDATE users SET is_email_verified = TRUE WHERE email = $1 RETURNING *`,
      [email]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = updated.rows[0];
    const token = signToken(user);

    return res.json({ success: true, message: 'Email verified successfully', token, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'OTP verification failed', error: err.message });
  }
}

async function resendOtp(req, res) {
  try {
    const { email, purpose = 'register' } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'email is required' });

    const otpCode = await createOtp(email, purpose);
    await sendOtpEmail(email, otpCode, purpose);

    return res.json({ success: true, message: 'OTP resent successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to resend OTP', error: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.is_email_verified) {
      const otpCode = await createOtp(email, 'register');
      await sendOtpEmail(email, otpCode, 'register');
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent.',
        requiresVerification: true,
      });
    }

    const token = signToken(user);
    return res.json({ success: true, message: 'Login successful', token, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ success: true, message: 'If this email exists, an OTP has been sent.' });
    }
    const otpCode = await createOtp(email, 'reset_password');
    await sendOtpEmail(email, otpCode, 'reset_password');
    return res.json({ success: true, message: 'If this email exists, an OTP has been sent.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'email, otp and newPassword are required' });
    }

    const isValid = await verifyOtp(email, otp, 'reset_password');
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);

    return res.json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
}

async function getMe(req, res) {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user: sanitizeUser(result.rows[0]) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
}

async function bootstrapAdmin(req, res) {
  try {
    const { name, email, password, setupKey } = req.body;

    if (!name || !email || !password || !setupKey) {
      return res.status(400).json({ success: false, message: 'name, email, password and setupKey are required' });
    }

    if (!process.env.ADMIN_SETUP_KEY || setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid setup key' });
    }

    const existingAdmin = await query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An admin already exists. Ask an existing admin to promote your account from the dashboard instead.',
      });
    }

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    const passwordHash = await bcrypt.hash(password, 10);

    let user;
    if (existingUser.rows.length > 0) {
      const updated = await query(
        `UPDATE users SET role = 'admin', is_email_verified = TRUE, password_hash = $1, name = $2
         WHERE email = $3 RETURNING *`,
        [passwordHash, name, email]
      );
      user = updated.rows[0];
    } else {
      const inserted = await query(
        `INSERT INTO users (name, email, password_hash, role, is_email_verified)
         VALUES ($1, $2, $3, 'admin', TRUE) RETURNING *`,
        [name, email, passwordHash]
      );
      user = inserted.rows[0];
    }

    const token = signToken(user);
    return res.status(201).json({ success: true, message: 'Admin account created', token, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to bootstrap admin', error: err.message });
  }
}

module.exports = {
  register,
  verifyRegisterOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  bootstrapAdmin,
};
