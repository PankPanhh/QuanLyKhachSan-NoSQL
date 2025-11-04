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

    // Kiểm tra trạng thái booking - cho phép tính phí cho "Đã xác nhận" và "Đang sử dụng"
    if (
      booking.TrangThai !== "Đang sử dụng" &&
      booking.TrangThai !== "Đã xác nhận"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Chỉ có thể tính phí trễ cho booking ở trạng thái 'Đã xác nhận' hoặc 'Đang sử dụng'",
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

    // Kiểm tra trạng thái - cho phép checkout từ "Đã xác nhận" hoặc "Đang sử dụng"
    if (
      booking.TrangThai !== "Đang sử dụng" &&
      booking.TrangThai !== "Đã xác nhận"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Chỉ có thể checkout booking ở trạng thái 'Đã xác nhận' hoặc 'Đang sử dụng'",
      });
    }

    // Cập nhật trạng thái booking
    booking.TrangThai = "Hoàn thành";

    // Lấy thông tin phòng
    const room = await Room.findOne({ MaPhong: booking.MaPhong });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin phòng",
      });
    }

    // Tính phí trễ nếu có
    const currentTime = new Date();
    const expectedCheckoutTime = new Date(booking.NgayTraPhong);
    let lateFee = 0;
    let lateHours = 0;

    if (currentTime > expectedCheckoutTime) {
      lateHours = differenceInHours(currentTime, expectedCheckoutTime);
      const hourlyRate = room.GiaPhong / 24;
      lateFee = Math.round(Math.ceil(lateHours) * (hourlyRate * 0.5)); // 50% giá giờ
    }

    // Tính tổng tiền nếu chưa có
    if (!booking.HoaDon || !booking.HoaDon.TongTien) {
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
        GiamGia: booking.HoaDon?.GiamGia || 0,
        TongTien:
          roomTotal + serviceTotal + lateFee - (booking.HoaDon?.GiamGia || 0),
        TinhTrang: "Chưa thanh toán",
        GhiChu:
          lateFee > 0
            ? `Phụ phí trả trễ ${lateHours} giờ: ${lateFee.toLocaleString(
                "vi-VN"
              )} VND`
            : booking.HoaDon?.GhiChu || "",
      };
    } else {
      // Nếu đã có hóa đơn, cộng thêm phí trễ vào tổng tiền
      if (lateFee > 0) {
        booking.HoaDon.TongTien = booking.HoaDon.TongTien + lateFee;
        const oldNote = booking.HoaDon.GhiChu || "";
        booking.HoaDon.GhiChu = oldNote
          ? `${oldNote}. Phụ phí trả trễ ${lateHours} giờ: ${lateFee.toLocaleString(
              "vi-VN"
            )} VND`
          : `Phụ phí trả trễ ${lateHours} giờ: ${lateFee.toLocaleString(
              "vi-VN"
            )} VND`;
      }
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
      lateFee,
      lateHours,
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

    // Validate input
    if (!paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin thanh toán",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền thanh toán phải lớn hơn 0",
      });
    }

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

    // Tính phí trễ nếu booking chưa hoàn thành (cho phép thanh toán bao gồm phí trễ)
    let lateFee = 0;
    if (booking.TrangThai !== "Hoàn thành") {
      const room = await Room.findOne({ MaPhong: booking.MaPhong });
      if (room) {
        const currentTime = new Date();
        const expectedCheckoutTime = new Date(booking.NgayTraPhong);
        if (currentTime > expectedCheckoutTime) {
          const lateHours = differenceInHours(
            currentTime,
            expectedCheckoutTime
          );
          const hourlyRate = room.GiaPhong / 24;
          lateFee = Math.round(Math.ceil(lateHours) * (hourlyRate * 0.5)); // 50% giá giờ
        }
      }
    }

    // Kiểm tra số tiền còn lại cần thanh toán (bao gồm cả phí trễ nếu có)
    const totalPaid =
      booking.HoaDon.LichSuThanhToan?.reduce((sum, payment) => {
        return payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum;
      }, 0) || 0;

    const totalAmountWithLateFee = booking.HoaDon.TongTien + lateFee;
    const remainingAmount = totalAmountWithLateFee - totalPaid;

    if (remainingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Hóa đơn đã được thanh toán đầy đủ",
      });
    }

    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Số tiền thanh toán vượt quá số tiền còn lại (${remainingAmount.toLocaleString(
          "vi-VN"
        )} VND)`,
        remainingAmount,
        lateFee: lateFee > 0 ? lateFee : undefined,
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

    // Tính lại tổng tiền đã thanh toán sau khi thêm payment mới
    const totalPaidAfter = booking.HoaDon.LichSuThanhToan.reduce(
      (sum, payment) => {
        return payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum;
      },
      0
    );

    // Cập nhật trạng thái hóa đơn (tính cả phí trễ nếu có)
    const finalTotalAmount = booking.HoaDon.TongTien + lateFee;
    if (totalPaidAfter >= finalTotalAmount) {
      booking.HoaDon.TinhTrang = "Đã thanh toán";
    } else if (totalPaidAfter > 0) {
      booking.HoaDon.TinhTrang = "Thanh toán một phần";
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Thanh toán thành công",
      payment: paymentRecord,
      totalPaid: totalPaidAfter,
      remainingAmount: Math.max(0, finalTotalAmount - totalPaidAfter),
      invoiceStatus: booking.HoaDon.TinhTrang,
      lateFee: lateFee > 0 ? lateFee : undefined,
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

    // Validation chi tiết
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Điểm đánh giá phải từ 1 đến 5",
      });
    }

    if (comment && comment.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Nhận xét không được vượt quá 2000 ký tự",
      });
    }

    const booking = await Booking.findOne({ MaDatPhong: bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt phòng",
      });
    }

    // Kiểm tra quyền: chỉ khách hàng của booking hoặc admin mới được đánh giá
    if (
      req.user.VaiTro !== "Admin" &&
      req.user.IDNguoiDung !== booking.IDKhachHang
    ) {
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

    // Ngăn đánh giá trùng lặp
    if (booking.DanhGia && booking.DanhGia.DiemDanhGia) {
      return res.status(409).json({
        success: false,
        message: "Booking này đã được đánh giá",
        existingReview: booking.DanhGia,
      });
    }

    // Sanitize comment đơn giản (loại bỏ HTML tags)
    const sanitizedComment = comment
      ? String(comment)
          .replace(/<[^>]*>/g, "")
          .trim()
      : "";

    booking.DanhGia = {
      DiemDanhGia: Number(rating),
      BinhLuan: sanitizedComment,
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

    // Populate thông tin khách hàng và phòng
    await booking.populate("IDKhachHang", "HoTen Email SoDienThoai");
    await booking.populate("MaPhong", "TenPhong LoaiPhong");

    // Tính tổng đã thanh toán
    const totalPaid =
      booking.HoaDon.LichSuThanhToan?.reduce((sum, payment) => {
        return payment.TrangThai === "Thành công" ? sum + payment.SoTien : sum;
      }, 0) || 0;

    // Tạo hóa đơn HTML đẹp
    const invoiceHTML = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
    .header h1 { font-size: 36px; margin-bottom: 10px; }
    .header p { font-size: 16px; opacity: 0.9; }
    .content { padding: 40px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-item { padding: 12px; background: #f8f9fa; border-radius: 8px; }
    .info-label { font-size: 13px; color: #6c757d; margin-bottom: 5px; }
    .info-value { font-size: 16px; color: #333; font-weight: 500; }
    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .table th { background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6; }
    .table td { padding: 12px; border-bottom: 1px solid #e9ecef; }
    .table tr:last-child td { border-bottom: none; }
    .total-row { background: #f8f9fa; font-weight: 600; font-size: 18px; }
    .total-row td { color: #667eea; }
    .payment-history { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .payment-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #dee2e6; }
    .payment-item:last-child { border-bottom: none; }
    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .status-paid { background: #d4edda; color: #155724; }
    .status-partial { background: #fff3cd; color: #856404; }
    .status-unpaid { background: #f8d7da; color: #721c24; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>🏨 HÓA ĐƠN THANH TOÁN</h1>
      <p>Khách sạn • Hotel Management System</p>
    </div>
    
    <div class="content">
      <!-- Thông tin hóa đơn -->
      <div class="section">
        <div class="section-title">📋 Thông tin hóa đơn</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Mã hóa đơn</div>
            <div class="info-value">${booking.HoaDon.MaHoaDon}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Mã đặt phòng</div>
            <div class="info-value">${booking.MaDatPhong}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Ngày lập</div>
            <div class="info-value">${new Date(
              booking.HoaDon.NgayLap
            ).toLocaleDateString("vi-VN")}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Trạng thái</div>
            <div class="info-value">
              <span class="status-badge ${
                booking.HoaDon.TinhTrang === "Đã thanh toán"
                  ? "status-paid"
                  : booking.HoaDon.TinhTrang === "Thanh toán một phần"
                  ? "status-partial"
                  : "status-unpaid"
              }">
                ${booking.HoaDon.TinhTrang}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Thông tin khách hàng -->
      <div class="section">
        <div class="section-title">👤 Thông tin khách hàng</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Họ tên</div>
            <div class="info-value">${booking.IDKhachHang?.HoTen || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${booking.IDKhachHang?.Email || "N/A"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Số điện thoại</div>
            <div class="info-value">${
              booking.IDKhachHang?.SoDienThoai || "N/A"
            }</div>
          </div>
          <div class="info-item">
            <div class="info-label">Phòng</div>
            <div class="info-value">${
              booking.MaPhong?.TenPhong || booking.MaPhong
            } - ${booking.MaPhong?.LoaiPhong || ""}</div>
          </div>
        </div>
      </div>

      <!-- Chi tiết thanh toán -->
      <div class="section">
        <div class="section-title">💰 Chi tiết thanh toán</div>
        <table class="table">
          <thead>
            <tr>
              <th>Khoản mục</th>
              <th style="text-align: right;">Số tiền (VND)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tiền phòng</td>
              <td style="text-align: right;">${
                booking.HoaDon.TongTienPhong?.toLocaleString("vi-VN") || 0
              }</td>
            </tr>
            <tr>
              <td>Tiền dịch vụ</td>
              <td style="text-align: right;">${
                booking.HoaDon.TongTienDichVu?.toLocaleString("vi-VN") || 0
              }</td>
            </tr>
            ${
              booking.HoaDon.GiamGia > 0
                ? `
            <tr>
              <td>Giảm giá</td>
              <td style="text-align: right; color: #28a745;">-${booking.HoaDon.GiamGia?.toLocaleString(
                "vi-VN"
              )}</td>
            </tr>`
                : ""
            }
            ${
              booking.HoaDon.PhuPhiTraTre > 0
                ? `
            <tr>
              <td>Phụ phí trả trễ</td>
              <td style="text-align: right; color: #dc3545;">+${booking.HoaDon.PhuPhiTraTre?.toLocaleString(
                "vi-VN"
              )}</td>
            </tr>`
                : ""
            }
            <tr class="total-row">
              <td>TỔNG CỘNG</td>
              <td style="text-align: right;">${booking.HoaDon.TongTien?.toLocaleString(
                "vi-VN"
              )} VND</td>
            </tr>
            <tr style="background: #d4edda;">
              <td style="color: #155724;">Đã thanh toán</td>
              <td style="text-align: right; color: #155724; font-weight: 600;">${totalPaid.toLocaleString(
                "vi-VN"
              )} VND</td>
            </tr>
            <tr style="background: #f8d7da;">
              <td style="color: #721c24;">Còn lại</td>
              <td style="text-align: right; color: #721c24; font-weight: 600;">${(
                booking.HoaDon.TongTien - totalPaid
              ).toLocaleString("vi-VN")} VND</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Lịch sử thanh toán -->
      ${
        booking.HoaDon.LichSuThanhToan?.length > 0
          ? `
      <div class="section">
        <div class="section-title">📝 Lịch sử thanh toán</div>
        <div class="payment-history">
          ${booking.HoaDon.LichSuThanhToan.map(
            (payment) => `
            <div class="payment-item">
              <div>
                <strong>${payment.PhuongThuc}</strong> - ${new Date(
              payment.NgayThanhToan
            ).toLocaleString("vi-VN")}
                ${
                  payment.GhiChu
                    ? `<br><small style="color: #6c757d;">${payment.GhiChu}</small>`
                    : ""
                }
              </div>
              <div style="font-weight: 600; color: #28a745;">
                ${payment.SoTien.toLocaleString("vi-VN")} VND
              </div>
            </div>
          `
          ).join("")}
        </div>
      </div>`
          : ""
      }

      ${
        booking.HoaDon.GhiChu
          ? `
      <div class="section">
        <div class="section-title">📌 Ghi chú</div>
        <p style="padding: 12px; background: #f8f9fa; border-radius: 8px;">${booking.HoaDon.GhiChu}</p>
      </div>`
          : ""
      }
    </div>

    <div class="footer">
      <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
      <p style="margin-top: 8px;">📞 Hotline: 1900-xxxx | 📧 Email: support@hotel.com</p>
    </div>
  </div>
</body>
</html>
    `;

    // Đánh dấu đã xuất hóa đơn
    booking.HoaDon.DaXuatHoaDon = true;
    booking.HoaDon.NgayXuatHoaDon = new Date();
    await booking.save();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="HoaDon_${bookingId}.html"`
    );
    res.send(invoiceHTML);
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

// @desc    Thong ke tra tre va phu phi
// @route   GET /api/v1/checkout/reports/late-checkouts?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Private (Admin)
export const getLateFeeReport = async (req, res, next) => {
  try {
    const today = new Date();
    const defaultEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );
    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultEnd.getDate() - 29); // Last 30 days

    const start = req.query.start ? new Date(req.query.start) : defaultStart;
    const end = req.query.end ? new Date(req.query.end) : defaultEnd;

    // Lấy tất cả bookings đã hoàn thành trong khoảng thời gian
    const bookings = await Booking.find({
      TrangThai: "Hoàn thành",
      updatedAt: { $gte: start, $lte: end },
    })
      .populate("MaPhong", "TenPhong GiaPhong")
      .sort({ updatedAt: -1 });

    const lateCheckouts = [];
    let totalLateFee = 0;
    let lateCount = 0;

    for (const booking of bookings) {
      const checkoutTime = new Date(booking.updatedAt);
      const expectedCheckoutTime = new Date(booking.NgayTraPhong);

      if (checkoutTime > expectedCheckoutTime) {
        const lateHours = differenceInHours(checkoutTime, expectedCheckoutTime);

        if (lateHours > 0) {
          // Tính phí trễ
          const room = await Room.findOne({ MaPhong: booking.MaPhong });
          let lateFee = 0;

          if (room) {
            const hourlyRate = room.GiaPhong / 24;
            lateFee = Math.ceil(lateHours) * (hourlyRate * 0.5);
          }

          lateCheckouts.push({
            MaDatPhong: booking.MaDatPhong,
            MaPhong: booking.MaPhong,
            TenPhong: room?.TenPhong || "N/A",
            NgayTraPhongDuKien: expectedCheckoutTime,
            NgayTraPhongThucTe: checkoutTime,
            SoGioTre: lateHours,
            PhuPhiTre: Math.round(lateFee),
          });

          totalLateFee += lateFee;
          lateCount++;
        }
      }
    }

    const totalBookings = bookings.length;
    const latePercentage =
      totalBookings > 0 ? ((lateCount / totalBookings) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalCheckouts: totalBookings,
          lateCheckouts: lateCount,
          latePercentage: `${latePercentage}%`,
          totalLateFee: Math.round(totalLateFee),
        },
        details: lateCheckouts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Thong ke ty le lap day phong (Occupancy Rate)
// @route   GET /api/v1/checkout/reports/occupancy?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Private (Admin)
export const getOccupancyRate = async (req, res, next) => {
  try {
    const today = new Date();
    const defaultEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );
    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultEnd.getDate() - 29); // Last 30 days

    const start = req.query.start ? new Date(req.query.start) : defaultStart;
    const end = req.query.end ? new Date(req.query.end) : defaultEnd;

    // Tổng số phòng trong hệ thống
    const totalRooms = await Room.countDocuments();

    // Tính số ngày trong khoảng thời gian
    const daysDiff = differenceInDays(end, start) + 1;
    const totalRoomNights = totalRooms * daysDiff; // Tổng số đêm có sẵn

    // Lấy tất cả bookings có overlap với khoảng thời gian
    const bookings = await Booking.find({
      TrangThai: { $in: ["Đã xác nhận", "Đang sử dụng", "Hoàn thành"] },
      NgayNhanPhong: { $lte: end },
      NgayTraPhong: { $gte: start },
    });

    // Tính tổng số đêm đã đặt
    let bookedRoomNights = 0;
    const roomUsage = new Map(); // Track usage by room

    for (const booking of bookings) {
      const checkIn = new Date(
        Math.max(new Date(booking.NgayNhanPhong).getTime(), start.getTime())
      );
      const checkOut = new Date(
        Math.min(new Date(booking.NgayTraPhong).getTime(), end.getTime())
      );

      const nights = differenceInDays(checkOut, checkIn);
      if (nights > 0) {
        bookedRoomNights += nights;

        // Track per room
        const roomCode = booking.MaPhong;
        if (!roomUsage.has(roomCode)) {
          roomUsage.set(roomCode, { nights: 0, bookings: 0 });
        }
        const usage = roomUsage.get(roomCode);
        usage.nights += nights;
        usage.bookings += 1;
      }
    }

    // Tính tỷ lệ lấp đầy
    const occupancyRate =
      totalRoomNights > 0
        ? ((bookedRoomNights / totalRoomNights) * 100).toFixed(2)
        : 0;

    // Tìm phòng được đặt nhiều nhất
    const topRooms = [];
    for (const [roomCode, usage] of roomUsage.entries()) {
      const room = await Room.findOne({ MaPhong: roomCode });
      topRooms.push({
        MaPhong: roomCode,
        TenPhong: room?.TenPhong || "N/A",
        LoaiPhong: room?.LoaiPhong || "N/A",
        SoDemDaDat: usage.nights,
        SoLanDat: usage.bookings,
        TyLelapDay: ((usage.nights / daysDiff) * 100).toFixed(2) + "%",
      });
    }

    // Sort by nights descending
    topRooms.sort((a, b) => b.SoDemDaDat - a.SoDemDaDat);

    res.status(200).json({
      success: true,
      data: {
        period: { start, end, days: daysDiff },
        summary: {
          totalRooms,
          totalRoomNights,
          bookedRoomNights,
          occupancyRate: `${occupancyRate}%`,
        },
        topRooms: topRooms.slice(0, 10), // Top 10 phòng
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lay diem danh gia trung binh cho phong
// @route   GET /api/v1/checkout/rooms/:roomCode/rating
// @access  Public
export const getRoomRating = async (req, res, next) => {
  try {
    const { roomCode } = req.params;

    // Lấy tất cả bookings đã hoàn thành cho phòng này có đánh giá
    const bookings = await Booking.find({
      MaPhong: roomCode,
      TrangThai: "Hoàn thành",
      "DanhGia.DiemDanhGia": { $exists: true, $ne: null },
    }).sort({ "DanhGia.NgayDanhGia": -1 });

    if (bookings.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          MaPhong: roomCode,
          averageRating: 0,
          totalReviews: 0,
          reviews: [],
        },
      });
    }

    // Tính điểm trung bình
    const totalRating = bookings.reduce(
      (sum, b) => sum + (b.DanhGia?.DiemDanhGia || 0),
      0
    );
    const averageRating = (totalRating / bookings.length).toFixed(1);

    // Lấy reviews chi tiết
    const reviews = bookings
      .filter((b) => b.DanhGia && b.DanhGia.DiemDanhGia)
      .map((b) => ({
        MaDatPhong: b.MaDatPhong,
        DiemDanhGia: b.DanhGia.DiemDanhGia,
        BinhLuan: b.DanhGia.BinhLuan || "",
        NgayDanhGia: b.DanhGia.NgayDanhGia,
      }));

    res.status(200).json({
      success: true,
      data: {
        MaPhong: roomCode,
        averageRating: parseFloat(averageRating),
        totalReviews: bookings.length,
        reviews: reviews.slice(0, 10), // Top 10 reviews mới nhất
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lay top phong duoc danh gia cao nhat
// @route   GET /api/v1/checkout/rooms/top-rated
// @access  Public
export const getTopRatedRooms = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Aggregate để tính điểm trung bình cho từng phòng
    const ratings = await Booking.aggregate([
      {
        $match: {
          TrangThai: "Hoàn thành",
          "DanhGia.DiemDanhGia": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$MaPhong",
          averageRating: { $avg: "$DanhGia.DiemDanhGia" },
          totalReviews: { $sum: 1 },
        },
      },
      { $sort: { averageRating: -1, totalReviews: -1 } },
      { $limit: limit },
    ]);

    // Lấy thông tin phòng
    const topRooms = [];
    for (const rating of ratings) {
      const room = await Room.findOne({ MaPhong: rating._id });
      if (room) {
        topRooms.push({
          MaPhong: rating._id,
          TenPhong: room.TenPhong,
          LoaiPhong: room.LoaiPhong,
          GiaPhong: room.GiaPhong,
          HinhAnh: room.HinhAnh?.[0] || null,
          averageRating: parseFloat(rating.averageRating.toFixed(1)),
          totalReviews: rating.totalReviews,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: topRooms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Thong ke so luot tra phong theo ngay/thang
// @route   GET /api/v1/checkout/reports/checkout-stats?start=YYYY-MM-DD&end=YYYY-MM-DD&groupBy=day|month
// @access  Private (Admin)
export const getCheckoutStatistics = async (req, res, next) => {
  try {
    const today = new Date();
    const defaultEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );
    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultEnd.getDate() - 29); // Last 30 days

    const start = req.query.start ? new Date(req.query.start) : defaultStart;
    const end = req.query.end ? new Date(req.query.end) : defaultEnd;
    const groupBy = req.query.groupBy || "day"; // 'day' or 'month'

    // Lấy tất cả bookings đã hoàn thành trong khoảng thời gian
    const bookings = await Booking.find({
      TrangThai: "Hoàn thành",
      updatedAt: { $gte: start, $lte: end }, // Dùng updatedAt để biết khi nào checkout
    }).sort({ updatedAt: 1 });

    // Group by day or month
    const stats = new Map();
    let totalRevenue = 0;
    let totalCheckouts = 0;

    for (const booking of bookings) {
      const checkoutDate = new Date(booking.updatedAt);
      let key;

      if (groupBy === "month") {
        key = `${checkoutDate.getFullYear()}-${String(
          checkoutDate.getMonth() + 1
        ).padStart(2, "0")}`;
      } else {
        // day
        key = `${checkoutDate.getFullYear()}-${String(
          checkoutDate.getMonth() + 1
        ).padStart(2, "0")}-${String(checkoutDate.getDate()).padStart(2, "0")}`;
      }

      if (!stats.has(key)) {
        stats.set(key, {
          period: key,
          checkouts: 0,
          revenue: 0,
          paidAmount: 0,
        });
      }

      const stat = stats.get(key);
      stat.checkouts += 1;
      stat.revenue += booking.HoaDon?.TongTien || 0;

      // Tính số tiền đã thanh toán
      const paidAmount =
        booking.HoaDon?.LichSuThanhToan?.reduce((sum, payment) => {
          return payment.TrangThai === "Thành công"
            ? sum + payment.SoTien
            : sum;
        }, 0) || 0;
      stat.paidAmount += paidAmount;

      totalRevenue += booking.HoaDon?.TongTien || 0;
      totalCheckouts += 1;
    }

    // Convert map to array
    const statsArray = Array.from(stats.values()).sort((a, b) =>
      a.period.localeCompare(b.period)
    );

    res.status(200).json({
      success: true,
      data: {
        period: { start, end, groupBy },
        summary: {
          totalCheckouts,
          totalRevenue: Math.round(totalRevenue),
          averageRevenuePerCheckout: Math.round(
            totalCheckouts > 0 ? totalRevenue / totalCheckouts : 0
          ),
        },
        statistics: statsArray,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tinh doanh thu thuc te (da thanh toan)
// @route   GET /api/v1/checkout/reports/revenue?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Private (Admin)
export const getActualRevenue = async (req, res, next) => {
  try {
    const today = new Date();
    const defaultEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );
    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultEnd.getDate() - 29); // Last 30 days

    const start = req.query.start ? new Date(req.query.start) : defaultStart;
    const end = req.query.end ? new Date(req.query.end) : defaultEnd;

    // Lấy tất cả bookings đã hoàn thành
    const bookings = await Booking.find({
      TrangThai: "Hoàn thành",
      updatedAt: { $gte: start, $lte: end },
    });

    let totalBilled = 0; // Tổng tiền hóa đơn
    let totalPaid = 0; // Tổng tiền đã thanh toán
    let totalUnpaid = 0; // Tổng tiền chưa thanh toán
    let totalRoomRevenue = 0;
    let totalServiceRevenue = 0;
    let totalDiscounts = 0;
    let totalLateFees = 0;

    const paymentMethodStats = {
      "Tiền mặt": 0,
      "Chuyển khoản": 0,
      "Thẻ tín dụng": 0,
      PayPal: 0,
      "Ví điện tử": 0,
    };

    for (const booking of bookings) {
      const invoice = booking.HoaDon;
      if (invoice) {
        totalBilled += invoice.TongTien || 0;
        totalRoomRevenue += invoice.TongTienPhong || 0;
        totalServiceRevenue += invoice.TongTienDichVu || 0;
        totalDiscounts += invoice.GiamGia || 0;

        // Tính phí trễ từ ghi chú (nếu có)
        if (invoice.GhiChu && invoice.GhiChu.includes("Phụ phí trả trễ")) {
          const match = invoice.GhiChu.match(/(\d[\d,]*)/);
          if (match) {
            const fee = parseInt(match[0].replace(/,/g, ""));
            totalLateFees += fee;
          }
        }

        // Tính tổng đã thanh toán
        const paidAmount =
          invoice.LichSuThanhToan?.reduce((sum, payment) => {
            if (payment.TrangThai === "Thành công") {
              // Track by payment method
              if (paymentMethodStats.hasOwnProperty(payment.PhuongThuc)) {
                paymentMethodStats[payment.PhuongThuc] += payment.SoTien;
              }
              return sum + payment.SoTien;
            }
            return sum;
          }, 0) || 0;

        totalPaid += paidAmount;
        totalUnpaid += Math.max(0, (invoice.TongTien || 0) - paidAmount);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        period: { start, end },
        summary: {
          totalCheckouts: bookings.length,
          totalBilled: Math.round(totalBilled),
          totalPaid: Math.round(totalPaid),
          totalUnpaid: Math.round(totalUnpaid),
          collectionRate:
            totalBilled > 0
              ? `${((totalPaid / totalBilled) * 100).toFixed(2)}%`
              : "0%",
        },
        breakdown: {
          roomRevenue: Math.round(totalRoomRevenue),
          serviceRevenue: Math.round(totalServiceRevenue),
          discounts: Math.round(totalDiscounts),
          lateFees: Math.round(totalLateFees),
        },
        paymentMethods: Object.entries(paymentMethodStats)
          .map(([method, amount]) => ({
            method,
            amount: Math.round(amount),
            percentage:
              totalPaid > 0
                ? `${((amount / totalPaid) * 100).toFixed(2)}%`
                : "0%",
          }))
          .filter((m) => m.amount > 0),
      },
    });
  } catch (error) {
    next(error);
  }
};
