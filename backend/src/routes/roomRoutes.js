import express from "express";
import multer from "multer";
import path from "path";
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getAvailableRooms,
  uploadRoomImage,
  checkRoomAvailability,
} from "../controllers/roomController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer setup - use memory storage so controller can decide filename and overwrite
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Chỉ chấp nhận ảnh (image/*)"));
  },
});

router
  .route("/")
  .get(getAllRooms) // Public
  .post(protect, authorize("Admin"), createRoom); // Private (Admin)

router.route("/available").get(getAvailableRooms); // Public

// Upload/overwrite image for a room (Admin only)
router
  .route("/:id/image")
  .put(protect, authorize("Admin"), upload.single("image"), uploadRoomImage);

// Check room availability for specific dates (Public)
router.route("/:id/availability").get(checkRoomAvailability);

router
  .route("/:id")
  .get(getRoomById) // Public
  .put(protect, authorize("Admin"), updateRoom) // Private (Admin)
  .delete(protect, authorize("Admin"), deleteRoom); // Private (Admin)

export default router;
