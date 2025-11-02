import express from 'express';
import multer from 'multer';
import {
  getAllServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
  uploadServiceImage,
  getServiceStats,
} from '../controllers/serviceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer setup (memory storage) used for image upload endpoints
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ chấp nhận ảnh (image/*)'));
  }
});

router
  .route('/')
  .get(getAllServices) // Public
  .post(protect, authorize('Admin'), createService); // Admin

// Public stats endpoint (used by public service detail page)
router.route('/:id/stats').get(getServiceStats);

// Image upload for service (Admin)
router.route('/:id/image').put(protect, authorize('Admin'), upload.single('image'), uploadServiceImage);

router
  .route('/:id')
  .get(getServiceById) // Public
  .put(protect, authorize('Admin'), updateService) // Admin
  .delete(protect, authorize('Admin'), deleteService); // Admin

export default router;
