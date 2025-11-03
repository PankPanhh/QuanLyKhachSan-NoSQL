import express from 'express';
import { getAllPromotions, getPromotionById, createPromotion, updatePromotion } from '../controllers/promoController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAllPromotions) // Public: aggregated from Room.KhuyenMai
  .post(protect, authorize('Admin'), createPromotion); // Admin

// GET /api/v1/promotions/:id
router.get('/:id', getPromotionById);

// PUT /api/v1/promotions/:id - update promotion fields across rooms (Admin)
router.put('/:id', protect, authorize('Admin'), updatePromotion);

export default router;
