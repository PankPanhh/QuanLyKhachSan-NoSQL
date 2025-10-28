import express from 'express';
import { getRevenueReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Chi Admin moi duoc xem bao cao
router.use(protect, authorize('Admin'));

router.get('/revenue', getRevenueReport);

export default router;
