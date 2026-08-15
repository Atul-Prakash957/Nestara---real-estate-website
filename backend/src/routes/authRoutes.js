const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const auth = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again later.' },
});

router.post('/register', otpLimiter, auth.register);
router.post('/verify-otp', auth.verifyRegisterOtp);
router.post('/resend-otp', otpLimiter, auth.resendOtp);
router.post('/login', auth.login);
router.post('/forgot-password', otpLimiter, auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
router.get('/me', requireAuth, auth.getMe);
router.post('/bootstrap-admin', otpLimiter, auth.bootstrapAdmin);

module.exports = router;