import express from 'express';
import {
  getAllAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  assignAmenityToRoom,
  removeAmenityFromRoom,
} from '../controllers/amenitiesController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public read
router.route('/').get(getAllAmenities);

// Admin operations on the common list
router.route('/').post(protect, authorize('Admin'), createAmenity);
router.route('/:code').put(protect, authorize('Admin'), updateAmenity).delete(protect, authorize('Admin'), deleteAmenity);

// Assign/unassign amenity to a room (Admin)
router.route('/:code/assign/:roomId').post(protect, authorize('Admin'), assignAmenityToRoom).delete(protect, authorize('Admin'), removeAmenityFromRoom);

export default router;
