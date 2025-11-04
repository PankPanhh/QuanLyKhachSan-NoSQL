import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import {
  adminListUsers,
  adminUpdateStatus,
  adminAddPoints,
  adminAddPointsByRevenue,
  adminAddPointsByBookings,
  adminRecalcTier,
  adminListCustomers
} from '../controllers/userManagementController.js';

const router = express.Router();

router.use(protect, requireRole('Admin', 'NhanVien'));

router.get('/users', adminListUsers);
router.patch('/users/:id/status', adminUpdateStatus);
router.patch('/users/:id/points', adminAddPoints);
router.patch('/users/:id/revenue', adminAddPointsByRevenue);
router.patch('/users/:id/bookings', adminAddPointsByBookings);
router.post('/users/:id/recalc-tier', adminRecalcTier);
router.get('/customers', adminListCustomers);
export default router;