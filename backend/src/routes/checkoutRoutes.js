import express from "express";
import {
  confirmCheckout,
  processCheckoutPayment,
  calculateLateFee,
  submitReview,
  getCheckoutStatistics,
  getCheckoutDetails,
  downloadInvoice,
  emailInvoice,
} from "../controllers/checkoutController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Xác nhận trả phòng - Nhân viên và Admin
router.post(
  "/:bookingId/confirm",
  protect,
  authorize("NhanVien", "Admin"),
  confirmCheckout
);

// Thanh toán khi trả phòng - Tất cả người dùng đã đăng nhập
router.post("/:bookingId/payment", protect, processCheckoutPayment);

// Tính phụ phí trả trễ
router.get("/:bookingId/late-fee", protect, calculateLateFee);

// Gửi đánh giá - Chỉ khách hàng
router.post("/:bookingId/review", protect, submitReview);

// Lấy thống kê checkout - Nhân viên và Admin
router.get(
  "/statistics",
  protect,
  authorize("NhanVien", "Admin"),
  getCheckoutStatistics
);

// Lấy chi tiết checkout
router.get("/:bookingId", protect, getCheckoutDetails);

// Tải hóa đơn PDF
router.get("/:bookingId/invoice/download", protect, downloadInvoice);

// Gửi hóa đơn qua email
router.post("/:bookingId/invoice/email", protect, emailInvoice);

export default router;
