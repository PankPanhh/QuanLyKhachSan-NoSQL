import mongoose from "mongoose";
import "../src/config/dotenv.js";

const roomSchema = new mongoose.Schema({}, { strict: false });
const Room = mongoose.model("Phong", roomSchema, "Phong");

// Danh sách phòng cần thêm
const missingRooms = [
  {
    MaPhong: "P204",
    LoaiPhong: "Deluxe",
    Tang: 2,
    GiaPhong: 1200000,
    SoGiuong: 2,
    SoNguoiToiDa: 3,
    DienTich: 30,
    TrangThai: "Đang sử dụng",
    MoTa: "Phòng Deluxe 2 giường đơn, view thành phố",
    TienNghi: [
      "WiFi miễn phí",
      "TV màn hình phẳng",
      "Điều hòa",
      "Minibar",
      "Két an toàn",
      "Bàn làm việc",
      "Máy sấy tóc",
    ],
    HinhAnh: [
      "https://example.com/images/p204_1.jpg",
      "https://example.com/images/p204_2.jpg",
    ],
  },
  {
    MaPhong: "P205",
    LoaiPhong: "Deluxe",
    Tang: 2,
    GiaPhong: 1200000,
    SoGiuong: 1,
    SoNguoiToiDa: 2,
    DienTich: 28,
    TrangThai: "Đang sử dụng",
    MoTa: "Phòng Deluxe giường đôi King size, view sông",
    TienNghi: [
      "WiFi miễn phí",
      "TV màn hình phẳng",
      "Điều hòa",
      "Minibar",
      "Két an toàn",
      "Bàn làm việc",
      "Máy sấy tóc",
      "Bồn tắm",
    ],
    HinhAnh: [
      "https://example.com/images/p205_1.jpg",
      "https://example.com/images/p205_2.jpg",
    ],
  },
  {
    MaPhong: "P206",
    LoaiPhong: "Superior",
    Tang: 2,
    GiaPhong: 1500000,
    SoGiuong: 1,
    SoNguoiToiDa: 2,
    DienTich: 35,
    TrangThai: "Trống",
    MoTa: "Phòng Superior giường đôi King size, view biển",
    TienNghi: [
      "WiFi miễn phí",
      "TV màn hình phẳng 50 inch",
      "Điều hòa",
      "Minibar cao cấp",
      "Két an toàn",
      "Bàn làm việc",
      "Máy sấy tóc",
      "Bồn tắm Jacuzzi",
      "Ban công",
    ],
    HinhAnh: [
      "https://example.com/images/p206_1.jpg",
      "https://example.com/images/p206_2.jpg",
      "https://example.com/images/p206_3.jpg",
    ],
  },
  {
    MaPhong: "P303",
    LoaiPhong: "Suite",
    Tang: 3,
    GiaPhong: 2500000,
    SoGiuong: 1,
    SoNguoiToiDa: 4,
    DienTich: 55,
    TrangThai: "Trống",
    MoTa: "Suite cao cấp với phòng khách riêng, view panorama",
    TienNghi: [
      "WiFi miễn phí",
      "TV màn hình phẳng 65 inch",
      "Điều hòa",
      "Minibar cao cấp",
      "Két an toàn",
      "Bàn làm việc",
      "Máy sấy tóc",
      "Bồn tắm Jacuzzi",
      "Ban công lớn",
      "Phòng khách riêng",
      "Máy pha cà phê",
      "Bàn ăn",
    ],
    HinhAnh: [
      "https://example.com/images/p303_1.jpg",
      "https://example.com/images/p303_2.jpg",
      "https://example.com/images/p303_3.jpg",
      "https://example.com/images/p303_4.jpg",
    ],
  },
  {
    MaPhong: "P304",
    LoaiPhong: "Suite",
    Tang: 3,
    GiaPhong: 2800000,
    SoGiuong: 2,
    SoNguoiToiDa: 5,
    DienTich: 65,
    TrangThai: "Trống",
    MoTa: "Suite VIP với 2 phòng ngủ, view 360 độ",
    TienNghi: [
      "WiFi miễn phí",
      "TV màn hình phẳng 65 inch (2 cái)",
      "Điều hòa",
      "Minibar cao cấp",
      "Két an toàn",
      "Bàn làm việc",
      "Máy sấy tóc",
      "Bồn tắm Jacuzzi",
      "Ban công panorama",
      "Phòng khách riêng",
      "Máy pha cà phê Nespresso",
      "Bàn ăn 6 người",
      "Bếp nhỏ",
      "2 phòng tắm",
    ],
    HinhAnh: [
      "https://example.com/images/p304_1.jpg",
      "https://example.com/images/p304_2.jpg",
      "https://example.com/images/p304_3.jpg",
      "https://example.com/images/p304_4.jpg",
      "https://example.com/images/p304_5.jpg",
    ],
  },
];

async function addMissingRooms() {
  try {
    await mongoose.connect("mongodb://localhost:27017/QuanLyKhachSan");
    console.log("✅ Connected to MongoDB");

    console.log("\n📋 Kiểm tra phòng đã tồn tại...");
    const roomCodes = missingRooms.map((r) => r.MaPhong);
    const existingRooms = await Room.find({ MaPhong: { $in: roomCodes } });
    const existingCodes = existingRooms.map((r) => r.MaPhong);

    // Lọc ra các phòng chưa tồn tại
    const roomsToAdd = missingRooms.filter(
      (r) => !existingCodes.includes(r.MaPhong)
    );

    if (roomsToAdd.length === 0) {
      console.log("✅ Tất cả phòng đã tồn tại trong database!");
      await mongoose.connection.close();
      return;
    }

    console.log(`\n📋 Sẽ thêm ${roomsToAdd.length} phòng mới:`);
    roomsToAdd.forEach((r) => {
      console.log(
        `   - ${r.MaPhong}: ${r.LoaiPhong} - ${r.GiaPhong.toLocaleString(
          "vi-VN"
        )}đ/đêm`
      );
    });

    // Thêm phòng mới
    const result = await Room.insertMany(roomsToAdd);
    console.log(`\n✅ Đã thêm ${result.length} phòng mới!`);

    // Thống kê theo loại phòng
    console.log("\n📊 Thống kê theo loại phòng:");
    const stats = {};
    result.forEach((r) => {
      if (!stats[r.LoaiPhong]) {
        stats[r.LoaiPhong] = { count: 0, totalPrice: 0 };
      }
      stats[r.LoaiPhong].count++;
      stats[r.LoaiPhong].totalPrice += r.GiaPhong;
    });

    Object.entries(stats).forEach(([type, data]) => {
      const avgPrice = data.totalPrice / data.count;
      console.log(
        `   - ${type}: ${data.count} phòng (TB: ${avgPrice.toLocaleString(
          "vi-VN"
        )}đ/đêm)`
      );
    });

    // Thống kê tổng quan
    console.log("\n📊 Tổng quan:");
    console.log(`   - Tổng số phòng đã thêm: ${result.length}`);
    console.log(`   - Tổng số phòng trong DB: ${await Room.countDocuments()}`);
    console.log(
      `   - Phòng trống: ${
        result.filter((r) => r.TrangThai === "Trống").length
      }`
    );
    console.log(
      `   - Phòng đang sử dụng: ${
        result.filter((r) => r.TrangThai === "Đang sử dụng").length
      }`
    );

    await mongoose.connection.close();
    console.log("\n✅ Hoàn tất! Refresh Compass để xem dữ liệu mới.");
    console.log(
      "💡 Bây giờ có thể chạy lại add-test-bookings.js mà không bị cảnh báo!"
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addMissingRooms();
