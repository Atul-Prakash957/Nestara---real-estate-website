const { query } = require('../config/db');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

async function createOtp(email, purpose = 'register') {
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // invalidate previous unused OTPs of same purpose
  await query(
    `UPDATE otp_verifications SET is_used = TRUE
     WHERE email = $1 AND purpose = $2 AND is_used = FALSE`,
    [email, purpose]
  );

  await query(
    `INSERT INTO otp_verifications (email, otp_code, purpose, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [email, otpCode, purpose, expiresAt]
  );

  return otpCode;
}

async function verifyOtp(email, otpCode, purpose = 'register') {
  const result = await query(
    `SELECT * FROM otp_verifications
     WHERE email = $1 AND otp_code = $2 AND purpose = $3
       AND is_used = FALSE AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [email, otpCode, purpose]
  );

  if (result.rows.length === 0) return false;

  await query(`UPDATE otp_verifications SET is_used = TRUE WHERE id = $1`, [
    result.rows[0].id,
  ]);

  return true;
}

module.exports = { generateOtp, createOtp, verifyOtp };
