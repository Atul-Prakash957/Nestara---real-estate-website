const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOtpEmail(toEmail, otpCode, purpose = 'register') {
  const subjectMap = {
    register: 'Verify your email - RealEstate App',
    login: 'Your login OTP - RealEstate App',
    reset_password: 'Reset your password - RealEstate App',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border:1px solid #eee; border-radius:8px; overflow:hidden;">
      <div style="background:#e4405f; padding:16px; text-align:center;">
        <h2 style="color:#fff; margin:0;">RealEstate App</h2>
      </div>
      <div style="padding:24px;">
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="font-size:32px; font-weight:bold; letter-spacing:8px; text-align:center; margin:20px 0; color:#e4405f;">
          ${otpCode}
        </div>
        <p>This OTP is valid for <b>10 minutes</b>. Do not share it with anyone.</p>
        <p style="color:#888; font-size:12px;">If you did not request this, please ignore this email.</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: subjectMap[purpose] || 'Your OTP Code',
    html,
  });
}

module.exports = { sendOtpEmail };
