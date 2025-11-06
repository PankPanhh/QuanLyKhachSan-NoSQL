import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load project models (assumes running from backend/)
import '../src/config/db.js';
import Booking from '../src/models/Booking.js';
import Room from '../src/models/Room.js';
import { calculateRoomPriceWithDiscount } from '../src/utils/calculateTotal.js';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node fix-booking-hoaDon.js <MaDatPhong|bookingId>');
  process.exit(1);
}

const run = async () => {
  try {
    // Connect using mongoose (db.js already attempts connect when imported if used in app)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    // Find booking by MaDatPhong or by _id
    let booking = null;
    if (/^[0-9a-fA-F]{24}$/.test(arg)) {
      booking = await Booking.findById(arg).lean();
    }
    if (!booking) {
      booking = await Booking.findOne({ MaDatPhong: arg }).lean();
    }
    if (!booking) {
      console.error('Booking not found for', arg);
      process.exit(2);
    }

    console.log('Found booking:', booking.MaDatPhong || booking._id);

    // Fetch room data if available
    const room = await Room.findOne({ MaPhong: booking.MaPhong }).lean();

    // Compute room price (original total) using util if room available
    let originalRoomTotal = 0;
    try {
      if (room) {
        const calc = calculateRoomPriceWithDiscount(room, booking.NgayNhanPhong, booking.NgayTraPhong, 1);
        originalRoomTotal = calc.originalTotal || (room.GiaPhong || 0);
        console.log('Room price calculation:', calc);
      } else {
        originalRoomTotal = booking.HoaDon?.TongTienPhong || 0;
      }
    } catch (e) {
      console.warn('Room price calc failed, using HoaDon.TongTienPhong if present');
      originalRoomTotal = booking.HoaDon?.TongTienPhong || 0;
    }

    // Compute service total from booking.DichVuSuDung
    let tongTienDichVu = 0;
    if (Array.isArray(booking.DichVuSuDung)) {
      tongTienDichVu = booking.DichVuSuDung.reduce((s, dv) => s + (Number(dv.ThanhTien || dv.ThanhTien || 0)), 0);
    }

    // Determine existing discount
    let giamGia = booking.HoaDon?.GiamGia || 0;

    // Recompute total
    const recomputedTongTien = Math.max(0, (Number(originalRoomTotal || 0) + Number(tongTienDichVu || 0) - Number(giamGia || 0)));

    // Compute paid amount from LichSuThanhToan (handle encoding variants)
    let paid = 0;
    if (booking.HoaDon && Array.isArray(booking.HoaDon.LichSuThanhToan)) {
      for (const p of booking.HoaDon.LichSuThanhToan) {
        const trangThai = (p.TrangThai || '') + '';
        const isSuccess = trangThai === 'Thành công' || trangThai.includes('ThÃ') || trangThai.toLowerCase().includes('thanh cong') || trangThai.toLowerCase().includes('success') || trangThai.includes('Thanh cong');
        if (isSuccess) paid += Number(p.SoTien || 0);
      }
    }

    // Decide invoice status
    let tinhTrang = 'Chưa thanh toán';
    if (paid <= 0) tinhTrang = 'Chưa thanh toán';
    else if (paid >= recomputedTongTien) tinhTrang = 'Đã thanh toán';
    else tinhTrang = 'Thanh toán một phần';

    console.log('Before update HoaDon:', booking.HoaDon || {});
    console.log({ originalRoomTotal, tongTienDichVu, giamGia, recomputedTongTien, paid, tinhTrang });

    // Update in DB (use findByIdAndUpdate)
    const update = {
      'HoaDon.TongTienPhong': originalRoomTotal,
      'HoaDon.TongTienDichVu': tongTienDichVu,
      'HoaDon.GiamGia': giamGia,
      'HoaDon.TongTien': recomputedTongTien,
      'HoaDon.TinhTrang': tinhTrang,
      updatedAt: new Date(),
    };

    const updated = await Booking.findByIdAndUpdate(booking._id, { $set: update }, { new: true });
    console.log('Updated booking HoaDon:', updated.HoaDon);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(3);
  }
};

run();
