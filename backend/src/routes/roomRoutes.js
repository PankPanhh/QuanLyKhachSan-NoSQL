import express from 'express';
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAllRooms) // Public
  .post(protect, authorize('Admin'), createRoom); // Private (Admin)

router.route('/:id')
  .get(getRoomById) // Public
  .put(protect, authorize('Admin'), updateRoom) // Private (Admin)
  .delete(protect, authorize('Admin'), deleteRoom); // Private (Admin)

export default router;
