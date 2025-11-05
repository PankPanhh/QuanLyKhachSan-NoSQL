import express from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import {
  getMe,
  updateMe,
  changePassword,
  listUsers,
  updateStatus,
  addPoints,
  getMyBookings,
} from "../controllers/profileController.js";

const router = express.Router();

// Hồ sơ cá nhân
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/change-password", protect, changePassword);
// Lấy lịch sử đặt phòng (history) của user hiện tại
router.get("/me/bookings", protect, getMyBookings);

// Quản trị người dùng
router.get("/users", protect, requireRole("Admin", "NhanVien"), listUsers);
router.patch(
  "/users/:id/status",
  protect,
  requireRole("Admin", "NhanVien"),
  updateStatus
);
router.patch(
  "/users/:id/points",
  protect,
  requireRole("Admin", "NhanVien"),
  addPoints
);

export default router;
