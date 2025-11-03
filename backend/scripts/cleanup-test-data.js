import mongoose from "mongoose";
import "../src/config/dotenv.js";

const bookingSchema = new mongoose.Schema({}, { strict: false });
const roomSchema = new mongoose.Schema({}, { strict: false });
const Booking = mongoose.model("DatPhong", bookingSchema, "DatPhong");
const Room = mongoose.model("Phong", roomSchema, "Phong");

async function cleanupTestData() {
  try {
    await mongoose.connect("mongodb://localhost:27017/QuanLyKhachSan");
    console.log("✅ Connected to MongoDB");

    console.log("\n🧹 BẮT ĐẦU DỌN DẸP DỮ LIỆU TEST...\n");

    // 1. Xóa tất cả test bookings
    console.log("📋 Xóa test bookings...");
    const deleteBookings = await Booking.deleteMany({
      MaDatPhong: { $regex: /^DP17/ },
    });
    console.log(`   ✅ Đã xóa ${deleteBookings.deletedCount} test bookings`);

    // 2. Reset trạng thái các phòng về "Trống"
    console.log("\n📋 Reset trạng thái phòng...");
    const updateRooms = await Room.updateMany(
      { TrangThai: "Đang sử dụng" },
      { $set: { TrangThai: "Trống" } }
    );
    console.log(
      `   ✅ Đã reset ${updateRooms.modifiedCount} phòng về trạng thái "Trống"`
    );

    // 3. Thống kê sau khi dọn dọn
    console.log("\n📊 Thống kê sau khi dọn dọn:");
    const totalBookings = await Booking.countDocuments();
    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ TrangThai: "Trống" });
    const busyRooms = await Room.countDocuments({ TrangThai: "Đang sử dụng" });
    const activeBookings = await Booking.countDocuments({
      TrangThai: { $in: ["Đang sử dụng", "Đã xác nhận"] },
    });

    console.log(`   - Tổng số bookings: ${totalBookings}`);
    console.log(`   - Bookings đang hoạt động: ${activeBookings}`);
    console.log(`   - Tổng số phòng: ${totalRooms}`);
    console.log(`   - Phòng trống: ${availableRooms}`);
    console.log(`   - Phòng đang sử dụng: ${busyRooms}`);

    await mongoose.connection.close();
    console.log("\n✅ Hoàn tất! Database đã được dọn dọn.");
    console.log("💡 Chạy add-test-bookings.js để thêm dữ liệu test mới.");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanupTestData();
