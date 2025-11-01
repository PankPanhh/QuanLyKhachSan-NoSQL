import express from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
} from "../controllers/bookingController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

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

router.put("/:id/cancel", cancelBooking); // Admin hoac chu booking tu huy

export default router;
