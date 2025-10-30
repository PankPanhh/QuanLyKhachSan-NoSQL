import express from 'express';
import { body } from 'express-validator';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/register',
  [
    // Kiem tra du lieu dau vao
    body('HoTen').notEmpty().withMessage('Ho ten la bat buoc'),
    body('Email').isEmail().withMessage('Email khong hop le'),
    body('MatKhau')
      .isLength({ min: 6 })
      .withMessage('Mat khau phai co it nhat 6 ky tu'),
  ],
  validateRequest, // Middleware xu ly loi validation
  registerUser
);

router.post(
  '/login',
  [
    body('Email').isEmail().withMessage('Email khong hop le'),
    body('MatKhau').notEmpty().withMessage('Mat khau la bat buoc'),
  ],
  validateRequest,
  loginUser
);

// Route nay yeu cau dang nhap (protect)
router.get('/me', protect, getMe);

export default router;
