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

async function sendLeadNotificationEmail(ownerEmail, { propertyTitle, propertyId, leadName, leadPhone, leadEmail, message }) {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const propertyUrl = `${clientUrl}/property/${propertyId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border:1px solid #eee; border-radius:8px; overflow:hidden;">
      <div style="background:#14213D; padding:16px; text-align:center;">
        <h2 style="color:#fff; margin:0;">New Enquiry on Your Property</h2>
      </div>
      <div style="padding:24px;">
        <p>Someone is interested in your listing:</p>
        <p style="font-weight:bold; margin:4px 0 16px;">${propertyTitle}</p>
        <table style="width:100%; font-size:14px; color:#333;">
          <tr><td style="padding:4px 0; color:#888;">Name</td><td style="padding:4px 0;">${leadName || 'Not provided'}</td></tr>
          <tr><td style="padding:4px 0; color:#888;">Phone</td><td style="padding:4px 0;">${leadPhone}</td></tr>
          <tr><td style="padding:4px 0; color:#888;">Email</td><td style="padding:4px 0;">${leadEmail || 'Not provided'}</td></tr>
        </table>
        ${message ? `<p style="margin-top:16px; padding:12px; background:#f5f7fa; border-radius:6px; font-size:14px;">"${message}"</p>` : ''}
        <a href="${propertyUrl}" style="display:inline-block; margin-top:20px; background:#FF6B4A; color:#fff; padding:10px 20px; border-radius:6px; text-decoration:none; font-size:14px;">View Listing</a>
        <p style="margin-top:20px; color:#888; font-size:12px;">You can also see all enquiries under My Listings → Enquiries in your account.</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: ownerEmail,
    subject: `New enquiry: ${propertyTitle}`,
    html,
  });
}

module.exports = { sendOtpEmail, sendLeadNotificationEmail };