import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import { calculateBookingTotal } from "../utils/calculateTotal.js";
import mongoose from "mongoose";
// import { sendEmail } from '../services/emailService.js';

// @desc    Test endpoint to check data
// @route   GET /api/v1/bookings/test
// @access  Public
export const testData = async (req, res, next) => {
  try {
    const simpleBookings = await Booking.find({}).limit(5);
    const userCount = await mongoose
      .model(
        "NguoiDung",
        new mongoose.Schema({}, { strict: false }),
        "NguoiDung"
      )
      .countDocuments();
    const roomCount = await mongoose
      .model("Phong", new mongoose.Schema({}, { strict: false }), "Phong")
      .countDocuments();

    res.status(200).json({
      simpleBookingsCount: simpleBookings.length,
      userCount,
      roomCount,
      sampleBooking: simpleBookings[0] || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tao don dat phong moi
// @route   POST /api/v1/bookings
// @access  Private (KhachHang da dang nhap)
export const createBooking = async (req, res, next) => {
  // Debugging: log incoming payload and authenticated user id
  try {
    try {
      console.log(
        "[bookingController.createBooking] incoming body:",
        JSON.stringify(req.body)
      );
    } catch (e) {
      console.log(
        "[bookingController.createBooking] incoming body (non-serializable)"
      );
    }
    if (req.user)
      console.log(
        "[bookingController.createBooking] req.user._id=",
        req.user._id
      );

    const {
      roomId,
      checkIn, // Mong doi 'yyyy-MM-dd'
      checkOut, // Mong doi 'yyyy-MM-dd'
      numGuests,
      numRooms,
      contactInfo,
    } = req.body;

    const userId = req.user._id; // Lay tu middleware 'protect'

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Khong tim thay phong" });
    }

    // Compute nights and totals. Use room.GiaPhong (model field) for price.
    const ciDate = new Date(checkIn);
    const coDate = new Date(checkOut);
    const nights = Math.max(
      1,
      Math.ceil((coDate.getTime() - ciDate.getTime()) / (1000 * 3600 * 24))
    );
    const pricePerNight = room.GiaPhong || room.pricePerNight || 0;
    const computedTotalRoomPrice = pricePerNight * nights * (numRooms || 1);

    // Use computed totals (safer), ignore client-provided totals to prevent manipulation
    const totalRoomPrice = computedTotalRoomPrice;

    // Payment data from client (optional)
    const paymentMeta = req.body.paymentMeta || {};
    const paidAmount = Number(paymentMeta.amount || 0);
    const paymentMethod =
      req.body.paymentMethod || paymentMeta.method || "Chuyển khoản";

    // Build HoaDon per Booking schema
    const now = new Date();
    const hoaDon = {
      MaHoaDon: `HD${Date.now().toString().slice(-6)}`,
      NgayLap: now,
      TongTienPhong: Number(totalRoomPrice) || 0,
      TongTienDichVu: 0,
      GiamGia: 0,
      TongTien: Number(totalRoomPrice) || 0,
      TinhTrang: "Chưa thanh toán", // Sẽ cập nhật sau
      GhiChu: paymentMeta.note || "",
      LichSuThanhToan: [],
    };

    if (paidAmount > 0) {
      hoaDon.LichSuThanhToan.push({
        MaThanhToan: `TT${Date.now().toString().slice(-6)}`,
        PhuongThuc:
          paymentMethod === "card"
            ? "Thẻ tín dụng"
            : paymentMethod === "paypal"
            ? "Thẻ tín dụng"
            : "Chuyển khoản",
        SoTien: Number(paidAmount),
        NgayThanhToan: now,
        TrangThai:
          paidAmount >= (Number(totalRoomPrice) || 0)
            ? "Thành công"
            : "Thanh toán một phần",
        GhiChu:
          paymentMeta.bankReference ||
          paymentMeta.qrUrl ||
          paymentMeta.note ||
          "",
      });
    }

    // Cập nhật TinhTrang dựa trên tổng LichSuThanhToan
    const totalPaid = hoaDon.LichSuThanhToan.reduce(
      (sum, item) => sum + item.SoTien,
      0
    );
    hoaDon.TinhTrang =
      totalPaid >= hoaDon.TongTien
        ? "Đã thanh toán"
        : totalPaid > 0
        ? "Thanh toán một phần"
        : "Chưa thanh toán";

    // Map user identifier: prefer IDKhachHang (client) or IDNguoiDung in user, else ObjectId string
    const IDKhachHang =
      req.body.IDKhachHang ||
      req.user?.IDNguoiDung ||
      (req.user?._id ? req.user._id.toString() : null);

    // MaPhong: prefer client-provided MaPhong, otherwise room.MaPhong or room._id
    const MaPhong =
      req.body.MaPhong || room.MaPhong || (room._id ? room._id.toString() : "");

    // Dates: prefer client-provided NgayNhanPhong/NgayTraPhong if present
    const NgayNhanPhong = req.body.NgayNhanPhong
      ? new Date(req.body.NgayNhanPhong)
      : ciDate;
    const NgayTraPhong = req.body.NgayTraPhong
      ? new Date(req.body.NgayTraPhong)
      : coDate;

    // SoNguoi: prefer client SoNguoi, then numGuests, fallback 1
    const SoNguoi = req.body.SoNguoi || numGuests || 1;

    // MaDatPhong: allow client to supply, otherwise generate
    const MaDatPhong =
      req.body.MaDatPhong || `DP${Date.now().toString().slice(-6)}`;

    // Determine booking and room status based on current time vs. booking dates
    const nowForStatus = now;
    const isActiveNow =
      nowForStatus >= NgayNhanPhong && nowForStatus < NgayTraPhong;
    const bookingStatus = isActiveNow ? "Đang sử dụng" : "Đang chờ"; // booking state
    // Room status should reflect whether it's currently occupied or simply reserved
    const initialRoomStatus = isActiveNow ? "Đang sử dụng" : "Đã đặt"; // room state

    const doc = {
      MaDatPhong,
      IDKhachHang,
      MaPhong: MaPhong,
      NgayDat: now,
      NgayNhanPhong: NgayNhanPhong,
      NgayTraPhong: NgayTraPhong,
      SoNguoi: SoNguoi,
      TienCoc: paidAmount || 0,
      // Trạng thái đặt phòng luôn là "Đang chờ" khi tạo, bất kể thanh toán
      TrangThai: "Đang chờ",
      TrangThai: bookingStatus,
      GhiChu: req.body.note || "",
      DichVuSuDung: req.body.services || [],
      HoaDon: hoaDon,
    };

    console.log(
      "[bookingController.createBooking] doc to create:",
      JSON.stringify(doc, null, 2)
    );

    // Defensive validation before letting Mongoose run: return a clear error
    const required = [
      "MaDatPhong",
      "IDKhachHang",
      "MaPhong",
      "NgayNhanPhong",
      "NgayTraPhong",
      "SoNguoi",
    ];
    const missing = required.filter(
      (k) => doc[k] === undefined || doc[k] === null || doc[k] === ""
    );
    if (missing.length > 0) {
      console.error(
        "[bookingController.createBooking] missing required fields:",
        missing
      );
      return res
        .status(400)
        .json({ message: "Missing required booking fields", missing, doc });
    }

    const booking = await Booking.create(doc);

    // Update room status so it reflects this booking immediately.
    try {
      await Room.findOneAndUpdate(
        { MaPhong },
        { $set: { TinhTrang: initialRoomStatus } }
      );
    } catch (err) {
      console.error(
        "[bookingController.createBooking] failed to update room status:",
        err
      );
    }

    // TODO: Gui email xac nhan
    // await sendEmail(contactInfo.email, 'Xac nhan dat phong', `Cam on ban da dat phong...`, `...`);

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Lay tat ca booking cua 1 user
// @route   GET /api/v1/bookings/mybookings
// @access  Private (KhachHang)
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate(
      "room"
    );
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// @desc    Lay chi tiet 1 booking
// @route   GET /api/v1/bookings/:id
// @access  Private (Chu booking hoac Admin)
export const getBookingById = async (req, res, next) => {
  // TODO: Logic lay chi tiet booking
  res.send(`GET Booking By ID: ${req.params.id}`);
};

// @desc    Huy booking
// @route   PUT /api/v1/bookings/:id/cancel
// @access  Private (Chu booking hoac Admin)
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Try find by _id first
    const booking = await Booking.findById(id);
    if (!booking) {
      // fallback: try find by MaDatPhong
      const byMa = await Booking.findOne({ MaDatPhong: id });
      if (!byMa) {
        return res.status(404).json({ message: "Booking not found" });
      }
      // use byMa
      byMa.TrangThai = "Đã hủy"; // set to 'Đã hủy' when cancelled
      await byMa.save();
      return res.status(200).json({ success: true, data: byMa });
    }

    booking.TrangThai = "Đã hủy"; // set to 'Đã hủy' when cancelled
    await booking.save();
    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin confirm booking (set to 'Đang sử dụng')
// @route   PATCH /api/v1/bookings/:id/confirm
// @access  Private (Admin)
export const confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) {
      const byMa = await Booking.findOne({ MaDatPhong: id });
      if (!byMa) {
        return res.status(404).json({ message: "Booking not found" });
      }
      byMa.TrangThai = "Đang sử dụng";
      await byMa.save();
      return res.status(200).json({ success: true, data: byMa });
    }

    booking.TrangThai = "Đang sử dụng";
    await booking.save();
    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Lay tat ca booking (Admin)
// @route   GET /api/v1/bookings
// @access  Private (Admin)
export const getAllBookings = async (req, res, next) => {
  try {
    // Đầu tiên thử lấy bookings đơn giản mà không aggregation
    const simpleBookings = await Booking.find({}).sort({ createdAt: -1 });
    console.log("Simple bookings count:", simpleBookings.length);
    console.log("First booking sample:", simpleBookings[0]);

    // Nếu có bookings, thử aggregation
    if (simpleBookings.length > 0) {
      const bookings = await Booking.aggregate([
        {
          $lookup: {
            from: "NguoiDung",
            localField: "IDKhachHang",
            foreignField: "IDNguoiDung",
            as: "KhachHang",
          },
        },
        {
          $unwind: {
            path: "$KhachHang",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "Phong",
            localField: "MaPhong",
            foreignField: "MaPhong",
            as: "Phong",
          },
        },
        {
          $unwind: {
            path: "$Phong",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);

      console.log("Aggregation result count:", bookings.length);
      console.log("First aggregated booking:", bookings[0]);
      console.log("Aggregation result type:", typeof bookings);
      console.log("Is array:", Array.isArray(bookings));

      const bookingsArray = Array.isArray(bookings) ? bookings : [];

      res.status(200).json({
        success: true,
        count: bookingsArray.length,
        data: bookingsArray,
      });
    } else {
      // Không có bookings, trả về empty array
      res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in getAllBookings:", error);
    next(error);
  }
};
