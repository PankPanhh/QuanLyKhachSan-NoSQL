import express from "express";
import {
  calculateLateFee,
  confirmCheckout,
  processPayment,
  getCheckoutDetails,
  submitReview,
  downloadInvoice,
  emailInvoice,
} from "../controllers/checkoutController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tất cả routes đều yêu cầu đăng nhập
router.use(protect);

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
