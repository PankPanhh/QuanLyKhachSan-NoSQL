import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  confirmBooking,
  getAllBookings,
  testData,
} from "../controllers/bookingController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Test route without auth
router.get("/test", testData);

// Yeu cau dang nhap cho tat ca
router.use(protect);

router
  .route("/")
  // Allow any authenticated user to create a booking (protect middleware applied to router)
  .post(createBooking) // Khach hang tao booking
  .get(authorize("Admin"), getAllBookings); // Admin xem tat ca

router.get("/mybookings", getMyBookings); // Khach hang/Nhan vien xem booking cua minh

router
  .route("/:id")
  .get(getBookingById) // Admin hoac chu booking tu xem
  .put(authorize("Admin"), (req, res) =>
    res.send("Admin update booking (TODO)")
  ); // Admin cap nhat

router.put("/:id/cancel", authorize("Admin"), cancelBooking); // Admin hoac chu booking tu huy
// Admin actions: confirm / cancel - require Admin role
router.patch("/:id/confirm", authorize("Admin"), confirmBooking);
router.patch("/:id/cancel", authorize("Admin"), cancelBooking);
export default router;
