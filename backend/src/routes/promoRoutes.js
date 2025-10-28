import express from 'express';
// TODO: Tao controller cho Promotion
// import { getAllPromos, createPromo } from '../controllers/promoController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  // .get(getAllPromos) // Public
  .post(protect, authorize('Admin'), (req, res) => res.send('CREATE Promo (TODO)')); // Admin

export default router;
