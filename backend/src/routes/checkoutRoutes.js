import express from "express";
import {
  calculateLateFee,
  confirmCheckout,
  processPayment,
  getCheckoutDetails,
  submitReview,
  downloadInvoice,
  emailInvoice,
  getLateFeeReport,
  getOccupancyRate,
  getRoomRating,
  getTopRatedRooms,
  getCheckoutStatistics,
  getActualRevenue,
} from "../controllers/checkoutController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (không cần đăng nhập)
router.get("/rooms/top-rated", getTopRatedRooms);
router.get("/rooms/:roomCode/rating", getRoomRating);

// Tất cả routes còn lại đều yêu cầu đăng nhập
router.use(protect);

// Routes báo cáo cho admin
router.get("/reports/late-checkouts", authorize("Admin"), getLateFeeReport);
router.get("/reports/occupancy", authorize("Admin"), getOccupancyRate);
router.get(
  "/reports/checkout-stats",
  authorize("Admin"),
  getCheckoutStatistics
);
router.get("/reports/revenue", authorize("Admin"), getActualRevenue);

// Routes cho admin
router.get("/:bookingId/late-fee", authorize("Admin"), calculateLateFee);
router.patch("/:bookingId/confirm", authorize("Admin"), confirmCheckout);
router.post("/:bookingId/payment", authorize("Admin"), processPayment);
router.get("/:bookingId", authorize("Admin"), getCheckoutDetails);
router.post("/:bookingId/invoice/email", authorize("Admin"), emailInvoice);

// Routes cho cả admin và khách hàng
router.post("/:bookingId/review", submitReview);
router.get("/:bookingId/invoice/download", downloadInvoice);

export default router;
