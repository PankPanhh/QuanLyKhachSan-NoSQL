import mongoose from "mongoose";
import "../src/config/dotenv.js";

const bookingSchema = new mongoose.Schema({}, { strict: false });
const roomSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model("DatPhong", bookingSchema, "DatPhong");
const Room = mongoose.model("Phong", roomSchema, "Phong");

const timestamp = Date.now();
const testBookings = [
  {
    MaDatPhong: `DP${timestamp}1`,
    IDKhachHang: "KH1762064804298",
    MaPhong: "P201",
    NgayDat: new Date("2025-10-28"),
    NgayNhanPhong: new Date("2025-10-28"),
    NgayTraPhong: new Date("2025-10-31"), // Trễ 3 ngày (max penalty)
    TrangThai: "Đang sử dụng",
    SoNguoi: 2,
    YeuCauDacBiet: "Giường đôi, view biển",
    HoaDon: {
      MaHoaDon: `HD${timestamp}1`,
      NgayLap: new Date("2025-10-28"),
      TongTienPhong: 3600000, // 1.2M x 3 ngày
      TongTienDichVu: 250000,
      TongTien: 3850000,
      TinhTrang: "Chưa thanh toán",
      PhuongThucThanhToan: "Tiền mặt",
    },
  },
  {
    MaDatPhong: `DP${timestamp}2`,
    IDKhachHang: "KH1762064804298",
    MaPhong: "P203",
    NgayDat: new Date("2025-11-01"),
    NgayNhanPhong: new Date("2025-11-01"),
    NgayTraPhong: new Date("2025-11-02"), // Trễ 1 ngày
    TrangThai: "Đang sử dụng",
    SoNguoi: 4,
    YeuCauDacBiet: "Phòng gia đình, tầng cao",
    HoaDon: {
      MaHoaDon: `HD${timestamp}2`,
      NgayLap: new Date("2025-11-01"),
      TongTienPhong: 1800000,
      TongTienDichVu: 320000,
      TongTien: 2120000,
      TinhTrang: "Chưa thanh toán",
      PhuongThucThanhToan: "Chuyển khoản",
    },
  },
  {
    MaDatPhong: `DP${timestamp}3`,
    IDKhachHang: "KH1762064804298",
    MaPhong: "P204",
    NgayDat: new Date("2025-11-02"),
    NgayNhanPhong: new Date("2025-11-02"),
    NgayTraPhong: new Date("2025-11-05"), // Còn 2 ngày nữa
    TrangThai: "Đang sử dụng",
    SoNguoi: 1,
    YeuCauDacBiet: "Phòng yên tĩnh",
    HoaDon: {
      MaHoaDon: `HD${timestamp}3`,
      NgayLap: new Date("2025-11-02"),
      TongTienPhong: 3600000, // 1.2M x 3 ngày
      TongTienDichVu: 180000,
      TongTien: 3780000,
      TinhTrang: "Chưa thanh toán",
      PhuongThucThanhToan: "Thẻ tín dụng",
    },
  },
  {
    MaDatPhong: `DP${timestamp}4`,
    IDKhachHang: "KH1762064804298",
    MaPhong: "P205",
    NgayDat: new Date("2025-11-03"),
    NgayNhanPhong: new Date("2025-11-03"),
    NgayTraPhong: new Date("2025-11-03"), // Trả ngay hôm nay (đúng hạn)
    TrangThai: "Đang sử dụng",
    SoNguoi: 2,
    YeuCauDacBiet: "Check-in sớm",
    HoaDon: {
      MaHoaDon: `HD${timestamp}4`,
      NgayLap: new Date("2025-11-03"),
      TongTienPhong: 1200000,
      TongTienDichVu: 0,
      TongTien: 1200000,
      TinhTrang: "Chưa thanh toán",
      PhuongThucThanhToan: "Ví điện tử",
    },
  },
  {
    MaDatPhong: `DP${timestamp}5`,
    IDKhachHang: "KH1762064804298",
    MaPhong: "P301",
    NgayDat: new Date("2025-10-31"),
    NgayNhanPhong: new Date("2025-10-31"),
    NgayTraPhong: new Date("2025-11-01"), // Trễ 2 ngày
    TrangThai: "Đang sử dụng",
    SoNguoi: 3,
    YeuCauDacBiet: "Phòng VIP, minibar đầy đủ",
    HoaDon: {
      MaHoaDon: `HD${timestamp}5`,
      NgayLap: new Date("2025-10-31"),
      TongTienPhong: 2500000,
      TongTienDichVu: 450000,
      TongTien: 2950000,
      TinhTrang: "Chưa thanh toán",
      PhuongThucThanhToan: "PayPal",
    },
  },
  {
    MaDatPhong: `DP${timestamp}6`,
    IDKhachHang: "KH1762064804298",
    MaPhong: "P302",
    NgayDat: new Date("2025-11-02"),
    NgayNhanPhong: new Date("2025-11-02"),
    NgayTraPhong: new Date("2025-11-04"), // Còn 1 ngày
    TrangThai: "Đang sử dụng",
    SoNguoi: 2,
    YeuCauDacBiet: "Phòng Honeymoon",
    HoaDon: {
      MaHoaDon: `HD${timestamp}6`,
      NgayLap: new Date("2025-11-02"),
      TongTienPhong: 2400000,
      TongTienDichVu: 300000,
      TongTien: 2700000,
      TinhTrang: "Chưa thanh toán",
      PhuongThucThanhToan: "Tiền mặt",
    },
  },
];

async function addTestBookings() {
  try {
    await mongoose.connect("mongodb://localhost:27017/QuanLyKhachSan");
    console.log("✅ Connected to MongoDB");

    // 1. Kiểm tra phòng có tồn tại không
    console.log("\n📋 Kiểm tra phòng...");
    const roomCodes = [...new Set(testBookings.map((b) => b.MaPhong))];
    const existingRooms = await Room.find({ MaPhong: { $in: roomCodes } });
    const existingRoomCodes = existingRooms.map((r) => r.MaPhong);

    const missingRooms = roomCodes.filter(
      (code) => !existingRoomCodes.includes(code)
    );
    if (missingRooms.length > 0) {
      console.log(
        `⚠️  Cảnh báo: Các phòng không tồn tại: ${missingRooms.join(", ")}`
      );
      console.log(
        "   Script sẽ tiếp tục nhưng cần tạo phòng này trong database!"
      );
    }

    // 2. Kiểm tra phòng có đang được đặt không
    console.log("\n📋 Kiểm tra phòng đang sử dụng...");
    const activeBookings = await Booking.find({
      MaPhong: { $in: roomCodes },
      TrangThai: { $in: ["Đang sử dụng", "Đã xác nhận"] },
    });

    if (activeBookings.length > 0) {
      console.log(`⚠️  Có ${activeBookings.length} phòng đang được đặt:`);
      activeBookings.forEach((b) => {
        console.log(`   - ${b.MaPhong} (${b.MaDatPhong}): ${b.TrangThai}`);
      });
      console.log("\n❓ Xóa booking cũ và thêm mới? (Y/N)");
      console.log(
        "   Nhấn Ctrl+C để hủy, hoặc đợi 5s để tự động xóa và thêm mới..."
      );

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Xóa bookings cũ của các phòng này
      await Booking.deleteMany({
        MaPhong: { $in: roomCodes },
        TrangThai: { $in: ["Đang sử dụng", "Đã xác nhận"] },
      });
      console.log("✅ Đã xóa bookings cũ");
    }

    // 3. Validate dữ liệu
    console.log("\n📋 Validate dữ liệu...");
    let hasError = false;
    testBookings.forEach((booking, index) => {
      if (!booking.MaDatPhong || !booking.MaPhong || !booking.IDKhachHang) {
        console.log(`❌ Booking ${index + 1}: Thiếu thông tin bắt buộc`);
        hasError = true;
      }
      if (!booking.HoaDon || !booking.HoaDon.MaHoaDon) {
        console.log(`❌ Booking ${index + 1}: Thiếu thông tin hóa đơn`);
        hasError = true;
      }
    });

    if (hasError) {
      console.log("\n❌ Có lỗi trong dữ liệu, vui lòng kiểm tra lại!");
      process.exit(1);
    }
    console.log("✅ Dữ liệu hợp lệ");

    // 4. Insert bookings mới
    console.log("\n📋 Thêm bookings mới...");
    const result = await Booking.insertMany(testBookings);
    console.log(`✅ Đã thêm ${result.length} bookings:`);
    result.forEach((b) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkoutDate = new Date(b.NgayTraPhong);
      checkoutDate.setHours(0, 0, 0, 0);
      const daysLate = Math.floor(
        (today - checkoutDate) / (1000 * 60 * 60 * 24)
      );

      let status = "";
      if (daysLate > 0) {
        status = `🔴 Trễ ${daysLate} ngày`;
      } else if (daysLate === 0) {
        status = "🟡 Trả hôm nay";
      } else {
        status = `🟢 Còn ${Math.abs(daysLate)} ngày`;
      }

      console.log(`   - ${b.MaDatPhong}: Phòng ${b.MaPhong} - ${status}`);
    });

    // 5. Cập nhật trạng thái phòng
    console.log("\n📋 Cập nhật trạng thái phòng...");
    for (const roomCode of existingRoomCodes) {
      await Room.updateOne(
        { MaPhong: roomCode },
        { $set: { TrangThai: "Đang sử dụng" } }
      );
    }
    console.log(
      `✅ Đã cập nhật ${existingRoomCodes.length} phòng thành "Đang sử dụng"`
    );

    // 6. Thống kê
    console.log("\n📊 Thống kê:");
    console.log(`   - Tổng bookings: ${result.length}`);
    console.log(
      `   - Tổng tiền: ${result
        .reduce((sum, b) => sum + b.HoaDon.TongTien, 0)
        .toLocaleString("vi-VN")}đ`
    );
    console.log(`   - Phòng: ${roomCodes.join(", ")}`);

    await mongoose.connection.close();
    console.log("\n✅ Hoàn tất! Refresh Compass để xem dữ liệu mới.");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addTestBookings();
