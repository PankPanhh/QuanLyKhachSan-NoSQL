import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import { calculateBookingTotal } from "../utils/calculateTotal.js";
// import { sendEmail } from '../services/emailService.js';

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

    // Use totals from client if provided (safer), otherwise computed
    const clientTotalRoomPrice =
      req.body.totalRoomPrice || computedTotalRoomPrice;

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
      TongTienPhong: Number(clientTotalRoomPrice) || 0,
      TongTienDichVu: 0,
      GiamGia: 0,
      TongTien: Number(clientTotalRoomPrice) || 0,
      TinhTrang:
        paidAmount >= (Number(clientTotalRoomPrice) || 0)
          ? "Đã thanh toán"
          : paidAmount > 0
          ? "Thanh toán một phần"
          : "Chưa thanh toán",
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
        TrangThai: "Đang xử lý",
        GhiChu:
          paymentMeta.bankReference ||
          paymentMeta.qrUrl ||
          paymentMeta.note ||
          "",
      });
    }

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

    const doc = {
      MaDatPhong,
      IDKhachHang,
      MaPhong: MaPhong,
      NgayDat: now,
      NgayNhanPhong: NgayNhanPhong,
      NgayTraPhong: NgayTraPhong,
      SoNguoi: SoNguoi,
      TienCoc: paidAmount || 0,
      TrangThai: "Đang chờ",
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

    // TODO: Cap nhat trang thai phong (neu can)

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
  // TODO: Logic huy booking
  res.send(`CANCEL Booking: ${req.params.id}`);
};

// @desc    Lay tat ca booking (Admin)
// @route   GET /api/v1/bookings
// @access  Private (Admin)
export const getAllBookings = async (req, res, next) => {
  // TODO: Logic lay tat ca booking (Admin)
  res.send("GET All Bookings (Admin)");
};
