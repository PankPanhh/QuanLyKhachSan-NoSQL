import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import { differenceInHours, differenceInDays } from "date-fns";

// @desc    Tinh phu phi tre hen
// @route   GET /api/v1/checkout/:bookingId/late-fee
// @access  Private (Admin)
export const calculateLateFee = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ MaDatPhong: bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt phòng",
      });
    }

    // Kiểm tra trạng thái booking
    if (booking.TrangThai !== "Đang sử dụng") {
      return res.status(400).json({
        success: false,
        message: "Booking không ở trạng thái đang sử dụng",
      });
    }

    const currentTime = new Date();
    const expectedCheckoutTime = new Date(booking.NgayTraPhong);

    // Nếu chưa quá thời gian trả phòng, không có phí trễ
    if (currentTime <= expectedCheckoutTime) {
      return res.status(200).json({
        success: true,
        lateFee: 0,
        message: "Chưa quá thời gian trả phòng",
      });
    }

    // Tính số giờ trễ
    const lateHours = differenceInHours(currentTime, expectedCheckoutTime);

    // Lấy thông tin phòng để tính phí trễ
    const room = await Room.findOne({ MaPhong: booking.MaPhong });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin phòng",
      });
    }

    // Tính phí trễ: 50% giá phòng mỗi giờ trễ
    const hourlyRate = room.GiaPhong / 24; // Giá theo giờ
    const lateFee = Math.ceil(lateHours) * (hourlyRate * 0.5); // 50% giá giờ

    res.status(200).json({
      success: true,
      lateFee: Math.round(lateFee),
      lateHours,
      hourlyRate: Math.round(hourlyRate),
      expectedCheckoutTime: booking.NgayTraPhong,
      currentTime,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xac nhan tra phong
// @route   PATCH /api/v1/checkout/:bookingId/confirm
// @access  Private (Admin)
export const confirmCheckout = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

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
        message: "Booking không ở trạng thái đang sử dụng",
      });
    }

    // Cập nhật trạng thái booking
    booking.TrangThai = "Hoàn thành";

    // Tính tổng tiền nếu chưa có
    if (!booking.HoaDon || !booking.HoaDon.TongTien) {
      // Tính tổng tiền dựa trên thông tin booking
      const room = await Room.findOne({ MaPhong: booking.MaPhong });
      const nights = differenceInDays(
        new Date(booking.NgayTraPhong),
        new Date(booking.NgayNhanPhong)
      );
      const roomTotal = room.GiaPhong * nights;

      const serviceTotal =
        booking.DichVuSuDung?.reduce(
          (sum, service) => sum + service.ThanhTien,
          0
        ) || 0;

      booking.HoaDon = {
        ...booking.HoaDon,
        MaHoaDon: `HD${bookingId}`,
        NgayLap: new Date(),
        TongTienPhong: roomTotal,
        TongTienDichVu: serviceTotal,
        TongTien: roomTotal + serviceTotal,
        TinhTrang: "Chưa thanh toán",
      };
    }

    await booking.save();

    // Cập nhật trạng thái phòng về trống
    await Room.findOneAndUpdate(
      { MaPhong: booking.MaPhong },
      { TinhTrang: "Trống" }
    );

    res.status(200).json({
      success: true,
      message: "Xác nhận trả phòng thành công",
      booking: {
        MaDatPhong: booking.MaDatPhong,
        TrangThai: booking.TrangThai,
        HoaDon: booking.HoaDon,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xu ly thanh toan
// @route   POST /api/v1/checkout/:bookingId/payment
// @access  Private (Admin)
export const processPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { paymentMethod, amount, notes } = req.body;

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
        message: "Booking chưa có hóa đơn",
      });
    }

    // Tạo lịch sử thanh toán
    const paymentRecord = {
      MaThanhToan: `PT${Date.now()}`,
      PhuongThuc: paymentMethod,
      SoTien: amount,
      NgayThanhToan: new Date(),
      TrangThai: "Thành công",
      GhiChu: notes,
    };

    // Thêm vào lịch sử thanh toán
    if (!booking.HoaDon.LichSuThanhToan) {
      booking.HoaDon.LichSuThanhToan = [];
    }
    booking.HoaDon.LichSuThanhToan.push(paymentRecord);

    // Tính tổng tiền đã thanh toán
    const totalPaid = booking.HoaDon.LichSuThanhToan.reduce((sum, payment) => {
      return payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum;
    }, 0);

    // Cập nhật trạng thái hóa đơn
    if (totalPaid >= booking.HoaDon.TongTien) {
      booking.HoaDon.TinhTrang = "Đã thanh toán";
    } else if (totalPaid > 0) {
      booking.HoaDon.TinhTrang = "Thanh toán một phần";
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Thanh toán thành công",
      payment: paymentRecord,
      totalPaid,
      remainingAmount: Math.max(0, booking.HoaDon.TongTien - totalPaid),
      invoiceStatus: booking.HoaDon.TinhTrang,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lay chi tiet checkout
// @route   GET /api/v1/checkout/:bookingId
// @access  Private (Admin)
export const getCheckoutDetails = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ MaDatPhong: bookingId })
      .populate("IDKhachHang", "HoTen Email SoDienThoai")
      .populate("MaPhong", "TenPhong GiaPhong");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt phòng",
      });
    }

    // Tính phí trễ nếu có
    const currentTime = new Date();
    const expectedCheckoutTime = new Date(booking.NgayTraPhong);
    let lateFee = 0;

    if (currentTime > expectedCheckoutTime) {
      const lateHours = differenceInHours(currentTime, expectedCheckoutTime);
      const room = await Room.findOne({ MaPhong: booking.MaPhong });
      if (room) {
        const hourlyRate = room.GiaPhong / 24;
        lateFee = Math.ceil(lateHours) * (hourlyRate * 0.5);
      }
    }

    res.status(200).json({
      success: true,
      booking: {
        MaDatPhong: booking.MaDatPhong,
        IDKhachHang: booking.IDKhachHang,
        MaPhong: booking.MaPhong,
        NgayNhanPhong: booking.NgayNhanPhong,
        NgayTraPhong: booking.NgayTraPhong,
        TrangThai: booking.TrangThai,
        DichVuSuDung: booking.DichVuSuDung,
        HoaDon: booking.HoaDon,
        DanhGia: booking.DanhGia,
      },
      lateFee: Math.round(lateFee),
      currentTime,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Gui danh gia
// @route   POST /api/v1/checkout/:bookingId/review
// @access  Private
export const submitReview = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { rating, comment } = req.body;

    const booking = await Booking.findOne({ MaDatPhong: bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt phòng",
      });
    }

    // Kiểm tra quyền: chỉ khách hàng của booking hoặc admin mới được đánh giá
    if (req.user.role !== "Admin" && req.user.id !== booking.IDKhachHang) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền đánh giá booking này",
      });
    }

    // Kiểm tra trạng thái booking
    if (booking.TrangThai !== "Hoàn thành") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá booking đã hoàn thành",
      });
    }

    booking.DanhGia = {
      DiemDanhGia: rating,
      BinhLuan: comment,
      NgayDanhGia: new Date(),
    };

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Đánh giá đã được gửi thành công",
      review: booking.DanhGia,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tai hoa don
// @route   GET /api/v1/checkout/:bookingId/invoice/download
// @access  Private
export const downloadInvoice = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

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
        message: "Booking chưa có hóa đơn",
      });
    }

    // Tạo nội dung hóa đơn đơn giản (trong thực tế nên dùng thư viện PDF)
    const invoiceContent = `
HÓA ĐƠN THANH TOÁN
Mã hóa đơn: ${booking.HoaDon.MaHoaDon}
Mã đặt phòng: ${booking.MaDatPhong}
Ngày lập: ${new Date(booking.HoaDon.NgayLap).toLocaleDateString("vi-VN")}

Tiền phòng: ${booking.HoaDon.TongTienPhong?.toLocaleString("vi-VN")} VND
Tiền dịch vụ: ${booking.HoaDon.TongTienDichVu?.toLocaleString("vi-VN")} VND
Giảm giá: ${booking.HoaDon.GiamGia?.toLocaleString("vi-VN")} VND
Tổng tiền: ${booking.HoaDon.TongTien?.toLocaleString("vi-VN")} VND

Trạng thái: ${booking.HoaDon.TinhTrang}
    `;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${bookingId}.txt"`
    );
    res.send(invoiceContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Gui hoa don qua email
// @route   POST /api/v1/checkout/:bookingId/invoice/email
// @access  Private (Admin)
export const emailInvoice = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { email } = req.body;

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
        message: "Booking chưa có hóa đơn",
      });
    }

    // Trong thực tế, nên gửi email thật
    // Ở đây chỉ mô phỏng
    console.log(`Sending invoice ${booking.HoaDon.MaHoaDon} to ${email}`);

    res.status(200).json({
      success: true,
      message: `Hóa đơn đã được gửi đến ${email}`,
      invoiceId: booking.HoaDon.MaHoaDon,
    });
  } catch (error) {
    next(error);
  }
};
