import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Vi du ap dung middleware:
// Tat ca routes duoi day deu yeu cau dang nhap (protect)
// Va chi Admin moi co quyen (authorize('Admin'))

router
  .route('/')
  .get(protect, authorize('Admin'), getAllUsers);

router
  .route('/:id')
  .get(protect, authorize('Admin', 'KhachHang'), getUserById) // KhachHang co the tu xem minh
  .put(protect, authorize('Admin', 'KhachHang'), updateUser) // KhachHang co the tu cap nhat minh
  .delete(protect, authorize('Admin'), deleteUser);

export default router;
