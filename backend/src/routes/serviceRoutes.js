import express from 'express';
import {
  getAllServices,
  createService,
} from '../controllers/serviceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAllServices) // Public
  .post(protect, authorize('Admin'), createService); // Admin

export default router;
