import express from 'express';
import {
  validators,
  registerWithAccount,
  registerGuest,
  verifyOtpAndCreateAccount,
  register,
  verifyOtp,
  login,
  checkRole,
  staffRegisterWithAccount,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { handleValidation } from '../middleware/validateMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// === API mới cho 2 lựa chọn đăng ký ===
router.post('/register-with-account', validators.registerWithAccount, handleValidation, registerWithAccount);
router.post('/register-guest', validators.registerGuest, handleValidation, registerGuest);
router.post('/verify-otp-account', validators.verifyOtpAccount, handleValidation, verifyOtpAndCreateAccount);

// Staff register (tùy chọn)
router.post('/staff/register-with-account', validators.registerWithAccount, handleValidation, staffRegisterWithAccount);

// Alias tương thích
router.post('/register', validators.registerWithAccount, handleValidation, register);
router.post('/verify-otp', validators.verifyOtpAccount, handleValidation, verifyOtp);

// Login chung cho mọi vai trò
router.post('/login', validators.login, handleValidation, login);

// Quên/đặt lại mật khẩu
router.post('/forgot-password', validators.forgotPassword, handleValidation, forgotPassword);
router.post('/reset-password', validators.resetPassword, handleValidation, resetPassword);

// Check role (JWT)
router.get('/check-role', protect, checkRole);

export default router;