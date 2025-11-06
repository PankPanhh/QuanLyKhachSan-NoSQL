import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đọc file database
const dbPath = path.join(__dirname, '../../db/QuanLyKhachSan.DatPhong.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let fixCount = 0;

// Duyệt qua tất cả booking và fix TrangThai
data.forEach((booking, index) => {
  if (booking.HoaDon && booking.HoaDon.LichSuThanhToan) {
    console.log(`Checking booking ${index}: ${booking._id?.$oid || booking._id || booking.MaDatPhong}`);
    booking.HoaDon.LichSuThanhToan.forEach((payment, pIndex) => {
      console.log(`  Payment ${pIndex}: TrangThai = "${payment.TrangThai}"`);
      // Fix các variant của "Thành công" bị encoding issue
      if (payment.TrangThai && (
          payment.TrangThai.includes("ThÃ nh") || 
          payment.TrangThai.includes("Thành") ||
          payment.TrangThai === "ThÃ nh cÃ´ng" ||
          payment.TrangThai === "Thanh cong" ||
          payment.TrangThai.toLowerCase().includes("thanh cong") ||
          payment.TrangThai.toLowerCase().includes("success")
      )) {
        console.log(`Fixing payment ${payment.MaThanhToan}: "${payment.TrangThai}" -> "Thành công"`);
        payment.TrangThai = "Thành công";
        fixCount++;
      }
    });
  }
});

if (fixCount > 0) {
  // Backup file gốc
  const backupPath = dbPath + '.backup.' + Date.now();
  fs.copyFileSync(dbPath, backupPath);
  console.log(`Backup created: ${backupPath}`);
  
  // Ghi file mới
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Fixed ${fixCount} payment status records`);
} else {
  console.log('No payment status issues found');
}