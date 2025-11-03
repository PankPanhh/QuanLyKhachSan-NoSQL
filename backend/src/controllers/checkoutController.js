import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import {
  generateInvoicePDF,
  sendInvoiceEmail,
} from "../services/invoiceService.js";

// Cấu hình phụ phí trả trễ
const LATE_FEE_CONFIG = {
  PERCENTAGE: 20, // 20% giá phòng mỗi ngày trễ
  MAX_DAYS: 3, // Tối đa tính 3 ngày
};

/**
 * @desc    Xác nhận trả phòng
 * @route   POST /api/v1/checkout/:bookingId/confirm
 * @access  Private (Nhân viên, Admin)
 */
export const confirmCheckout = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { actualCheckoutDate } = req.body;

    // Tìm đặt phòng
    const booking = await Booking.findOne({ MaDatPhong: bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt phòng",
      });
    }

    // Kiểm tra trạng thái
    if (booking.TrangThai !== "Đang sử dụng") {
      return res.status(400).json({
        success: false,
        message: "Phòng chưa được nhận hoặc đã trả",
      });
    }

    // Tính phụ phí trả trễ (nếu có)
    const checkoutDate = actualCheckoutDate
      ? new Date(actualCheckoutDate)
      : new Date();
    const scheduledCheckout = new Date(booking.NgayTraPhong);
    let lateFee = 0;
    let isLate = false;

    if (checkoutDate > scheduledCheckout) {
      isLate = true;
      const daysLate = Math.ceil(
        (checkoutDate - scheduledCheckout) / (1000 * 60 * 60 * 24)
      );
      const effectiveDays = Math.min(daysLate, LATE_FEE_CONFIG.MAX_DAYS);

      // Lấy thông tin phòng để tính phí
      const room = await Room.findOne({ MaPhong: booking.MaPhong });
      if (room) {
        lateFee =
          room.GiaPhong * (LATE_FEE_CONFIG.PERCENTAGE / 100) * effectiveDays;
      }
    }

    // Cập nhật hóa đơn với phụ phí
    if (!booking.HoaDon) {
      return res.status(400).json({
        success: false,
        message: "Hóa đơn chưa được tạo",
      });
    }

    // Lưu phụ phí riêng, KHÔNG cộng vào TongTien
    booking.HoaDon.PhuPhiTraTre = lateFee;

    // Cập nhật thông tin trả phòng
    booking.NgayTraPhongThucTe = checkoutDate;
    booking.TraTre = isLate;
    booking.TrangThai = "Hoàn thành";

    // Cập nhật trạng thái phòng
    await Room.findOneAndUpdate(
      { MaPhong: booking.MaPhong },
      { TinhTrang: "Trống" }
    );

    await booking.save();

    // Tính tổng tiền bao gồm phụ phí
    const totalAmount = booking.HoaDon.TongTien + lateFee;
    const totalPaid = booking.HoaDon.LichSuThanhToan.reduce(
      (sum, payment) =>
        payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum,
      0
    );

    res.status(200).json({
      success: true,
      message: "Xác nhận trả phòng thành công",
      data: {
        booking,
        lateFee,
        isLate,
        totalAmount,
        remainingAmount: totalAmount - totalPaid,
      },
    });
  } catch (error) {
    console.error("Error confirming checkout:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xác nhận trả phòng",
      error: error.message,
    });
  }
};

/**
 * @desc    Thanh toán khi trả phòng
 * @route   POST /api/v1/checkout/:bookingId/payment
 * @access  Private (Nhân viên, Admin, Khách hàng)
 */
export const processCheckoutPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { phuongThuc, soTien, ghiChu } = req.body;

    // Validate input
    if (!phuongThuc || !soTien || soTien <= 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp phương thức và số tiền thanh toán",
      });
    }

    // Tìm đặt phòng
    const booking = await Booking.findOne({ MaDatPhong: bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt phòng",
      });
    }

    if (!booking.HoaDon) {
      return res.status(400).json({
        success: false,
        message: "Hóa đơn chưa được tạo",
      });
    }

    // Tính tổng đã thanh toán
    const totalPaid = booking.HoaDon.LichSuThanhToan.reduce(
      (sum, payment) =>
        payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum,
      0
    );

    // Tính tổng tiền chính xác (tránh dùng TongTien bị corrupt)
    const baseTongTien =
      (booking.HoaDon.TongTienPhong || 0) +
      (booking.HoaDon.TongTienDichVu || 0) -
      (booking.HoaDon.GiamGia || 0);
    const lateFee = booking.HoaDon.PhuPhiTraTre || 0;
    const totalAmount = baseTongTien + lateFee;
    const remainingAmount = totalAmount - totalPaid;

    // Kiểm tra số tiền thanh toán
    if (soTien > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Số tiền thanh toán vượt quá số tiền còn lại (${remainingAmount.toLocaleString()} VNĐ)`,
      });
    }

    // Tạo mã thanh toán
    const maThanhToan = `TT${Date.now()}`;

    // Thêm lịch sử thanh toán
    booking.HoaDon.LichSuThanhToan.push({
      MaThanhToan: maThanhToan,
      PhuongThuc: phuongThuc,
      SoTien: soTien,
      NgayThanhToan: new Date(),
      TrangThai: "Thành công",
      GhiChu: ghiChu || "Thanh toán khi trả phòng",
    });

    // Cập nhật tình trạng hóa đơn
    const newTotalPaid = totalPaid + soTien;

    // Sử dụng lại totalAmount đã tính ở trên (đã tính đúng)
    if (newTotalPaid >= totalAmount) {
      booking.HoaDon.TinhTrang = "Đã thanh toán";
    } else {
      booking.HoaDon.TinhTrang = "Thanh toán một phần";
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Thanh toán thành công",
      data: {
        maThanhToan,
        soTienThanhToan: soTien,
        tongDaThanhToan: newTotalPaid,
        conLai: totalAmount - newTotalPaid,
        tinhTrang: booking.HoaDon.TinhTrang,
      },
      booking: booking, // Thêm booking để frontend có thể reload
    });
  } catch (error) {
    console.error("Error processing checkout payment:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xử lý thanh toán",
      error: error.message,
    });
  }
};

/**
 * @desc    Tính phụ phí trả trễ
 * @route   GET /api/v1/checkout/:bookingId/late-fee
 * @access  Private
 */
export const calculateLateFee = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { checkoutDate } = req.query;

    const booking = await Booking.findOne({ MaDatPhong: bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt phòng",
      });
    }

    const actualCheckoutDate = checkoutDate
      ? new Date(checkoutDate)
      : new Date();
    const scheduledCheckout = new Date(booking.NgayTraPhong);

    let lateFee = 0;
    let isLate = false;
    let daysLate = 0;

    if (actualCheckoutDate > scheduledCheckout) {
      isLate = true;
      daysLate = Math.ceil(
        (actualCheckoutDate - scheduledCheckout) / (1000 * 60 * 60 * 24)
      );

      const room = await Room.findOne({ MaPhong: booking.MaPhong });
      if (room) {
        const effectiveDays = Math.min(daysLate, LATE_FEE_CONFIG.MAX_DAYS);
        lateFee =
          room.GiaPhong * (LATE_FEE_CONFIG.PERCENTAGE / 100) * effectiveDays;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        isLate,
        daysLate,
        lateFee,
        scheduledCheckout,
        actualCheckoutDate,
        feePercentage: LATE_FEE_CONFIG.PERCENTAGE,
      },
    });
  } catch (error) {
    console.error("Error calculating late fee:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tính phụ phí",
      error: error.message,
    });
  }
};

/**
 * @desc    Gửi đánh giá sau khi trả phòng
 * @route   POST /api/v1/checkout/:bookingId/review
 * @access  Private (Khách hàng)
 */
export const submitReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { diemDanhGia, binhLuan } = req.body;

    // Validate
    if (!diemDanhGia || diemDanhGia < 1 || diemDanhGia > 5) {
      return res.status(400).json({
        success: false,
        message: "Điểm đánh giá phải từ 1 đến 5",
      });
    }

    const booking = await Booking.findOne({ MaDatPhong: bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt phòng",
      });
    }

    // Kiểm tra quyền đánh giá (Khách hàng hoặc Admin/Nhân viên)
    const isOwner = booking.IDKhachHang === req.user.IDNguoiDung;
    const isStaff = ["Admin", "NhanVien"].includes(req.user.VaiTro);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền đánh giá đặt phòng này",
      });
    }

    // Kiểm tra trạng thái
    if (booking.TrangThai !== "Hoàn thành") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá sau khi hoàn thành đặt phòng",
      });
    }

    // Kiểm tra đã đánh giá chưa
    if (booking.DanhGia && booking.DanhGia.DiemDanhGia) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá đặt phòng này rồi",
      });
    }

    // Lưu đánh giá
    booking.DanhGia = {
      DiemDanhGia: diemDanhGia,
      BinhLuan: binhLuan || "",
      NgayDanhGia: new Date(),
    };

    await booking.save();

    // Cập nhật điểm trung bình cho phòng
    const allBookings = await Booking.find({
      MaPhong: booking.MaPhong,
      "DanhGia.DiemDanhGia": { $exists: true },
    });

    const avgRating =
      allBookings.reduce((sum, b) => sum + (b.DanhGia?.DiemDanhGia || 0), 0) /
      allBookings.length;

    await Room.findOneAndUpdate(
      { MaPhong: booking.MaPhong },
      { $set: { DiemDanhGia: Math.round(avgRating * 10) / 10 } }
    );

    res.status(200).json({
      success: true,
      message: "Gửi đánh giá thành công",
      data: booking.DanhGia,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi gửi đánh giá",
      error: error.message,
    });
  }
};

/**
 * @desc    Lấy thống kê check-out
 * @route   GET /api/v1/checkout/statistics
 * @access  Private (Nhân viên, Admin)
 */
export const getCheckoutStatistics = async (req, res) => {
  try {
    const { startDate, endDate, period = "day" } = req.query;

    const matchQuery = { TrangThai: "Hoàn thành" };

    if (startDate && endDate) {
      matchQuery.NgayTraPhongThucTe = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Thống kê tổng quan
    const totalCheckouts = await Booking.countDocuments(matchQuery);

    const checkoutData = await Booking.find(matchQuery);

    // Tính doanh thu thực tế
    const totalRevenue = checkoutData.reduce(
      (sum, booking) => sum + (booking.HoaDon?.TongTien || 0),
      0
    );

    // Số lượng trả trễ
    const lateCheckouts = checkoutData.filter((b) => b.TraTre).length;

    // Tổng phụ phí trả trễ
    const totalLateFees = checkoutData.reduce(
      (sum, booking) => sum + (booking.HoaDon?.PhuPhiTraTre || 0),
      0
    );

    // Thống kê theo thời gian
    let groupBy;
    if (period === "month") {
      groupBy = {
        year: { $year: "$NgayTraPhongThucTe" },
        month: { $month: "$NgayTraPhongThucTe" },
      };
    } else if (period === "day") {
      groupBy = {
        year: { $year: "$NgayTraPhongThucTe" },
        month: { $month: "$NgayTraPhongThucTe" },
        day: { $dayOfMonth: "$NgayTraPhongThucTe" },
      };
    }

    const timeSeriesData = await Booking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          revenue: { $sum: "$HoaDon.TongTien" },
          lateFees: { $sum: "$HoaDon.PhuPhiTraTre" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Tỷ lệ lấp đầy phòng
    const totalRooms = await Room.countDocuments();
    const totalDays =
      startDate && endDate
        ? Math.ceil(
            (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
          )
        : 30;
    const occupancyRate = (totalCheckouts / (totalRooms * totalDays)) * 100;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCheckouts,
          totalRevenue,
          lateCheckouts,
          totalLateFees,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          lateCheckoutRate:
            Math.round((lateCheckouts / totalCheckouts) * 10000) / 100,
        },
        timeSeries: timeSeriesData,
      },
    });
  } catch (error) {
    console.error("Error getting checkout statistics:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};

/**
 * @desc    Lấy thông tin chi tiết checkout
 * @route   GET /api/v1/checkout/:bookingId
 * @access  Private
 */
export const getCheckoutDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ MaDatPhong: bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt phòng",
      });
    }

    const room = await Room.findOne({ MaPhong: booking.MaPhong });

    // Tính tổng đã thanh toán
    const totalPaid =
      booking.HoaDon?.LichSuThanhToan.reduce(
        (sum, payment) =>
          payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum,
        0
      ) || 0;

    // Tính tổng tiền bao gồm phụ phí trả trễ
    const lateFee = booking.HoaDon?.PhuPhiTraTre || 0;
    const totalAmount = (booking.HoaDon?.TongTien || 0) + lateFee;
    const remainingAmount = totalAmount - totalPaid;

    res.status(200).json({
      success: true,
      data: {
        booking,
        room: {
          MaPhong: room?.MaPhong,
          TenPhong: room?.TenPhong,
          LoaiPhong: room?.LoaiPhong,
          GiaPhong: room?.GiaPhong,
        },
        payment: {
          totalPaid,
          totalAmount,
          lateFee,
          remainingAmount,
          status: booking.HoaDon?.TinhTrang,
        },
      },
    });
  } catch (error) {
    console.error("Error getting checkout details:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin",
      error: error.message,
    });
  }
};

/**
 * @desc    Tạo và tải xuống hóa đơn PDF
 * @route   GET /api/v1/checkout/:bookingId/invoice/download
 * @access  Private
 */
export const downloadInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Tạo PDF
    const { filePath, fileName } = await generateInvoicePDF(bookingId);

    // Gửi file PDF
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error downloading invoice:", err);
        res.status(500).json({
          success: false,
          message: "Lỗi khi tải hóa đơn",
          error: err.message,
        });
      }
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo hóa đơn",
      error: error.message,
    });
  }
};

/**
 * @desc    Gửi hóa đơn qua email
 * @route   POST /api/v1/checkout/:bookingId/invoice/email
 * @access  Private
 */
export const emailInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { email } = req.body;

    await sendInvoiceEmail(bookingId, email);

    res.status(200).json({
      success: true,
      message: "Hóa đơn đã được gửi qua email",
    });
  } catch (error) {
    console.error("Error emailing invoice:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi gửi email",
      error: error.message,
    });
  }
};
