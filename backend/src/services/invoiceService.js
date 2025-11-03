import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { sendEmail } from "./emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đảm bảo thư mục invoices tồn tại
const invoicesDir = path.join(__dirname, "..", "..", "invoices");
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

/**
 * Định dạng tiền tệ VND
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Định dạng ngày tháng
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Tạo PDF hóa đơn
 */
export const generateInvoicePDF = async (bookingId) => {
  try {
    // Lấy thông tin đặt phòng
    const booking = await Booking.findOne({ MaDatPhong: bookingId });
    if (!booking) {
      throw new Error("Không tìm thấy đặt phòng");
    }

    // Lấy thông tin phòng và khách hàng
    const room = await Room.findOne({ MaPhong: booking.MaPhong });
    const customer = await User.findOne({ IDNguoiDung: booking.IDKhachHang });

    if (!booking.HoaDon) {
      throw new Error("Hóa đơn chưa được tạo");
    }

    // Tạo tên file
    const fileName = `HD_${booking.HoaDon.MaHoaDon}_${Date.now()}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    // Tạo PDF document
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header - Tên khách sạn
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("KHÁCH SẠN ABC", { align: "center" })
      .fontSize(10)
      .font("Helvetica")
      .text("Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM", { align: "center" })
      .text("Điện thoại: (028) 1234 5678 | Email: info@khachsan.vn", {
        align: "center",
      })
      .moveDown(2);

    // Tiêu đề hóa đơn
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("HÓA ĐƠN THANH TOÁN", { align: "center" })
      .moveDown();

    // Thông tin hóa đơn
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Mã hóa đơn: ${booking.HoaDon.MaHoaDon}`)
      .text(`Ngày lập: ${formatDate(booking.HoaDon.NgayLap || new Date())}`)
      .text(`Mã đặt phòng: ${booking.MaDatPhong}`)
      .moveDown();

    // Đường kẻ ngang
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Thông tin khách hàng
    doc.fontSize(12).font("Helvetica-Bold").text("THÔNG TIN KHÁCH HÀNG");
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Họ tên: ${customer?.HoTen || "N/A"}`)
      .text(`Email: ${customer?.Email || "N/A"}`)
      .text(`Số điện thoại: ${customer?.SDT || "N/A"}`)
      .moveDown();

    // Thông tin phòng
    doc.fontSize(12).font("Helvetica-Bold").text("THÔNG TIN PHÒNG");
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Mã phòng: ${room?.MaPhong || "N/A"}`)
      .text(`Tên phòng: ${room?.TenPhong || "N/A"}`)
      .text(`Loại phòng: ${room?.LoaiPhong || "N/A"}`)
      .text(`Ngày nhận phòng: ${formatDate(booking.NgayNhanPhong)}`)
      .text(`Ngày trả phòng: ${formatDate(booking.NgayTraPhong)}`);

    if (booking.NgayTraPhongThucTe) {
      doc.text(
        `Ngày trả phòng thực tế: ${formatDate(booking.NgayTraPhongThucTe)}`
      );
    }

    // Tính số đêm
    const nights = Math.ceil(
      (new Date(booking.NgayTraPhong) - new Date(booking.NgayNhanPhong)) /
        (1000 * 60 * 60 * 24)
    );
    doc.text(`Số đêm: ${nights} đêm`).moveDown();

    // Đường kẻ ngang
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Chi tiết hóa đơn
    doc.fontSize(12).font("Helvetica-Bold").text("CHI TIẾT HÓA ĐƠN");
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 300;
    const col3 = 450;

    doc.fontSize(11).font("Helvetica-Bold");
    doc.text("Mô tả", col1, tableTop);
    doc.text("Số lượng", col2, tableTop);
    doc.text("Thành tiền", col3, tableTop, { width: 100, align: "right" });

    // Đường kẻ dưới header
    doc
      .moveTo(50, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .stroke();
    doc.moveDown();

    let currentY = doc.y;

    // Tiền phòng
    doc.fontSize(10).font("Helvetica");
    doc.text(`Phòng ${room?.TenPhong || booking.MaPhong}`, col1, currentY);
    doc.text(`${nights} đêm`, col2, currentY);
    doc.text(formatCurrency(booking.HoaDon.TongTienPhong), col3, currentY, {
      width: 100,
      align: "right",
    });
    currentY += 20;

    // Dịch vụ (nếu có)
    if (booking.DichVuSuDung && booking.DichVuSuDung.length > 0) {
      doc.moveDown();
      booking.DichVuSuDung.forEach((dv) => {
        doc.text(`Dịch vụ ${dv.MaDichVu}`, col1, currentY);
        doc.text(`${dv.SoLuong}`, col2, currentY);
        doc.text(formatCurrency(dv.ThanhTien), col3, currentY, {
          width: 100,
          align: "right",
        });
        currentY += 20;
      });
    }

    // Tổng tiền dịch vụ
    if (booking.HoaDon.TongTienDichVu > 0) {
      doc.moveDown();
      currentY = doc.y;
      doc.font("Helvetica-Bold");
      doc.text("Tổng tiền dịch vụ:", col1, currentY);
      doc.text(formatCurrency(booking.HoaDon.TongTienDichVu), col3, currentY, {
        width: 100,
        align: "right",
      });
      currentY += 20;
    }

    // Giảm giá
    if (booking.HoaDon.GiamGia > 0) {
      doc.moveDown();
      currentY = doc.y;
      doc.font("Helvetica");
      doc.text("Giảm giá/Khuyến mãi:", col1, currentY);
      doc.text(`-${formatCurrency(booking.HoaDon.GiamGia)}`, col3, currentY, {
        width: 100,
        align: "right",
      });
      currentY += 20;
    }

    // Phụ phí trả trễ
    if (booking.HoaDon.PhuPhiTraTre > 0) {
      doc.moveDown();
      currentY = doc.y;
      doc.fillColor("red");
      doc.text("Phụ phí trả trễ:", col1, currentY);
      doc.text(
        `+${formatCurrency(booking.HoaDon.PhuPhiTraTre)}`,
        col3,
        currentY,
        {
          width: 100,
          align: "right",
        }
      );
      doc.fillColor("black");
      currentY += 25;
    }

    // Đường kẻ
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Tổng cộng
    currentY = doc.y;
    doc.fontSize(14).font("Helvetica-Bold");
    doc.text("TỔNG CỘNG:", col1, currentY);
    doc.text(formatCurrency(booking.HoaDon.TongTien), col3, currentY, {
      width: 100,
      align: "right",
    });

    // Lịch sử thanh toán
    if (
      booking.HoaDon.LichSuThanhToan &&
      booking.HoaDon.LichSuThanhToan.length > 0
    ) {
      doc.moveDown(2);
      doc.fontSize(12).font("Helvetica-Bold").text("LỊCH SỬ THANH TOÁN");
      doc.moveDown(0.5);

      booking.HoaDon.LichSuThanhToan.forEach((payment, index) => {
        if (payment.TrangThai === "Thành công") {
          doc
            .fontSize(10)
            .font("Helvetica")
            .text(`${index + 1}. ${formatDate(payment.NgayThanhToan)}`);
          doc.text(`   Phương thức: ${payment.PhuongThuc}`);
          doc.text(`   Số tiền: ${formatCurrency(payment.SoTien)}`);
          doc.moveDown(0.5);
        }
      });
    }

    // Trạng thái thanh toán
    doc.moveDown();
    doc.fontSize(11).font("Helvetica-Bold");
    const tinhTrang = booking.HoaDon.TinhTrang;
    if (tinhTrang === "Đã thanh toán") {
      doc
        .fillColor("green")
        .text(`Trạng thái: ${tinhTrang}`, { align: "center" });
    } else {
      doc
        .fillColor("orange")
        .text(`Trạng thái: ${tinhTrang}`, { align: "center" });
    }
    doc.fillColor("black");

    // Ghi chú (nếu có)
    if (booking.HoaDon.GhiChu) {
      doc.moveDown();
      doc
        .fontSize(10)
        .font("Helvetica-Oblique")
        .text(`Ghi chú: ${booking.HoaDon.GhiChu}`);
    }

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(9)
      .font("Helvetica")
      .text("Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!", {
        align: "center",
      })
      .text("Hẹn gặp lại!", { align: "center" });

    // Kết thúc document
    doc.end();

    // Đợi stream ghi xong
    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    return {
      filePath,
      fileName,
    };
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    throw error;
  }
};

/**
 * Gửi hóa đơn qua email
 */
export const sendInvoiceEmail = async (bookingId, customerEmail) => {
  try {
    // Tạo PDF
    const { filePath, fileName } = await generateInvoicePDF(bookingId);

    // Lấy thông tin đặt phòng
    const booking = await Booking.findOne({ MaDatPhong: bookingId });
    const customer = await User.findOne({ IDNguoiDung: booking.IDKhachHang });

    // Gửi email
    const emailOptions = {
      to: customerEmail || customer?.Email,
      subject: `Hóa đơn thanh toán - ${booking.HoaDon.MaHoaDon}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Xin chào ${
            customer?.HoTen || "Quý khách"
          },</h2>
          <p>Cảm ơn quý khách đã sử dụng dịch vụ của Khách sạn ABC.</p>
          <p>Đính kèm là hóa đơn thanh toán chi tiết cho đặt phòng của quý khách.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Thông tin đặt phòng:</h3>
            <p><strong>Mã đặt phòng:</strong> ${booking.MaDatPhong}</p>
            <p><strong>Mã hóa đơn:</strong> ${booking.HoaDon.MaHoaDon}</p>
            <p><strong>Tổng tiền:</strong> ${formatCurrency(
              booking.HoaDon.TongTien
            )}</p>
            <p><strong>Trạng thái:</strong> ${booking.HoaDon.TinhTrang}</p>
          </div>
          
          <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua:</p>
          <ul>
            <li>Email: info@khachsan.vn</li>
            <li>Điện thoại: (028) 1234 5678</li>
          </ul>
          
          <p style="margin-top: 30px;">Trân trọng,<br><strong>Khách sạn ABC</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          path: filePath,
        },
      ],
    };

    await sendEmail(emailOptions);

    // Xóa file sau khi gửi (tùy chọn)
    // fs.unlinkSync(filePath);

    return {
      success: true,
      message: "Hóa đơn đã được gửi qua email",
    };
  } catch (error) {
    console.error("Error sending invoice email:", error);
    throw error;
  }
};

/**
 * Xóa các file PDF hóa đơn cũ (chạy định kỳ)
 */
export const cleanOldInvoices = (daysOld = 30) => {
  try {
    const files = fs.readdirSync(invoicesDir);
    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      const filePath = path.join(invoicesDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtime.getTime();

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old invoice: ${file}`);
      }
    });

    return {
      success: true,
      message: `Cleaned invoices older than ${daysOld} days`,
    };
  } catch (error) {
    console.error("Error cleaning old invoices:", error);
    throw error;
  }
};
