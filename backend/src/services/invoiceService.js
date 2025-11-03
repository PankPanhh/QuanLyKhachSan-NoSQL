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
      .text("KHACH SAN ABC", { align: "center" })
      .fontSize(10)
      .text("Dia chi: 123 Duong ABC, Quan 1, TP.HCM", { align: "center" })
      .text("Dien thoai: (028) 1234 5678 | Email: info@khachsan.vn", {
        align: "center",
      })
      .moveDown(2);

    // Tiêu đề hóa đơn
    doc.fontSize(20).text("HOA DON THANH TOAN", { align: "center" }).moveDown();

    // Thông tin hóa đơn
    doc
      .fontSize(11)
      .text(`Ma hoa don: ${booking.HoaDon.MaHoaDon}`)
      .text(`Ngay lap: ${formatDate(booking.HoaDon.NgayLap || new Date())}`)
      .text(`Ma dat phong: ${booking.MaDatPhong}`)
      .moveDown();

    // Đường kẻ ngang
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Thông tin khách hàng
    doc.fontSize(12).text("THONG TIN KHACH HANG");
    doc
      .fontSize(11)
      .text(`Ho ten: ${customer?.HoTen || "N/A"}`)
      .text(`Email: ${customer?.Email || "N/A"}`)
      .text(`So dien thoai: ${customer?.SDT || "N/A"}`)
      .moveDown();

    // Thông tin phòng
    doc.fontSize(12).text("THONG TIN PHONG");
    doc
      .fontSize(11)
      .text(`Ma phong: ${room?.MaPhong || "N/A"}`)
      .text(`Ten phong: ${room?.TenPhong || "N/A"}`)
      .text(`Loai phong: ${room?.LoaiPhong || "N/A"}`)
      .text(`Ngay nhan phong: ${formatDate(booking.NgayNhanPhong)}`)
      .text(`Ngay tra phong: ${formatDate(booking.NgayTraPhong)}`);

    if (booking.NgayTraPhongThucTe) {
      doc.text(
        `Ngay tra phong thuc te: ${formatDate(booking.NgayTraPhongThucTe)}`
      );
    }

    // Tính số đêm
    const nights = Math.ceil(
      (new Date(booking.NgayTraPhong) - new Date(booking.NgayNhanPhong)) /
        (1000 * 60 * 60 * 24)
    );
    doc.text(`So dem: ${nights} dem`).moveDown();

    // Đường kẻ ngang
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Chi tiết hóa đơn
    doc.fontSize(12).text("CHI TIET HOA DON");
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 300;
    const col3 = 450;

    doc.fontSize(11);
    doc.text("Mo ta", col1, tableTop);
    doc.text("So luong", col2, tableTop);
    doc.text("Thanh tien", col3, tableTop, { width: 100, align: "right" });

    // Đường kẻ dưới header
    doc
      .moveTo(50, doc.y + 5)
      .lineTo(550, doc.y + 5)
      .stroke();
    doc.moveDown();

    let currentY = doc.y;

    // Tiền phòng
    doc.fontSize(10);
    doc.text(`Phong ${room?.TenPhong || booking.MaPhong}`, col1, currentY);
    doc.text(`${nights} dem`, col2, currentY);
    doc.text(formatCurrency(booking.HoaDon.TongTienPhong), col3, currentY, {
      width: 100,
      align: "right",
    });
    currentY += 20;

    // Dịch vụ (nếu có)
    if (booking.DichVuSuDung && booking.DichVuSuDung.length > 0) {
      doc.moveDown();
      booking.DichVuSuDung.forEach((dv) => {
        doc.text(`Dich vu ${dv.MaDichVu}`, col1, currentY);
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
      doc.text("Tong tien dich vu:", col1, currentY);
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
      doc.text("Giam gia/Khuyen mai:", col1, currentY);
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
      doc.text("Phu phi tra tre:", col1, currentY);
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

    // Tổng cộng - FIX: Tính lại đúng với smart detection
    currentY = doc.y;
    const tongTienPhong = booking.HoaDon.TongTienPhong || 0;
    const tongTienDichVu = booking.HoaDon.TongTienDichVu || 0;
    const giamGia = booking.HoaDon.GiamGia || 0;
    const phuPhiTraTre = booking.HoaDon.PhuPhiTraTre || 0;
    const correctTongTien =
      tongTienPhong + tongTienDichVu - giamGia + phuPhiTraTre;

    doc.fontSize(14);
    doc.text("TONG CONG:", col1, currentY);
    doc.text(formatCurrency(correctTongTien), col3, currentY, {
      width: 100,
      align: "right",
    });

    // Lịch sử thanh toán
    if (
      booking.HoaDon.LichSuThanhToan &&
      booking.HoaDon.LichSuThanhToan.length > 0
    ) {
      doc.moveDown(2);
      doc.fontSize(12).text("LICH SU THANH TOAN");
      doc.moveDown(0.5);

      booking.HoaDon.LichSuThanhToan.forEach((payment, index) => {
        if (payment.TrangThai === "Thanh cong") {
          doc
            .fontSize(10)
            .text(`${index + 1}. ${formatDate(payment.NgayThanhToan)}`);
          doc.text(`   Phuong thuc: ${payment.PhuongThuc}`);
          doc.text(`   So tien: ${formatCurrency(payment.SoTien)}`);
          doc.moveDown(0.5);
        }
      });
    }

    // Trạng thái thanh toán
    doc.moveDown();
    doc.fontSize(11);
    const tinhTrang = booking.HoaDon.TinhTrang;
    if (tinhTrang === "Da thanh toan") {
      doc
        .fillColor("green")
        .text(`Trang thai: ${tinhTrang}`, { align: "center" });
    } else {
      doc
        .fillColor("orange")
        .text(`Trang thai: ${tinhTrang}`, { align: "center" });
    }
    doc.fillColor("black");

    // Ghi chú (nếu có)
    if (booking.HoaDon.GhiChu) {
      doc.moveDown();
      doc.fontSize(10).text(`Ghi chu: ${booking.HoaDon.GhiChu}`);
    }

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(9)
      .text("Cam on quy khach da su dung dich vu cua chung toi!", {
        align: "center",
      })
      .text("Hen gap lai!", { align: "center" });

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
