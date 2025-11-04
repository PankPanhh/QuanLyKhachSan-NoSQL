// Script thêm dữ liệu mẫu cho checkout testing
import "../src/config/dotenv.js";
import "../src/config/db.js";
import Booking from "../src/models/Booking.js";

// Generate test data
function generateTestBookings() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const timestamp = Date.now();

  const bookings = [
    // Booking 1: Đang sử dụng - Sắp trả phòng
    {
      MaDatPhong: `DP${timestamp}001`,
      IDKhachHang: "KH1730728866857",
      MaPhong: "P101",
      NgayDat: threeDaysAgo,
      NgayNhanPhong: twoDaysAgo,
      NgayTraPhong: now,
      SoNguoi: 2,
      TienCoc: 500000,
      TrangThai: "Đang sử dụng",
      GhiChu: "Khách VIP",
      DichVuSuDung: [
        {
          MaDichVu: "DV001",
          SoLuong: 2,
          ThanhTien: 200000,
        },
      ],
      HoaDon: {
        MaHoaDon: `HD${timestamp}001`,
        NgayLap: twoDaysAgo,
        TongTienPhong: 2400000,
        TongTienDichVu: 200000,
        GiamGia: 0,
        TongTien: 2600000,
        TinhTrang: "Thanh toán một phần",
        LichSuThanhToan: [
          {
            MaThanhToan: `PT${timestamp}001`,
            PhuongThuc: "Tiền mặt",
            SoTien: 500000,
            NgayThanhToan: twoDaysAgo,
            TrangThai: "Thành công",
            GhiChu: "Tiền cọc",
          },
        ],
      },
    },

    // Booking 2: Đang sử dụng - Trả trễ (late fee)
    {
      MaDatPhong: `DP${timestamp}002`,
      IDKhachHang: "KH1730728866857",
      MaPhong: "P102",
      NgayDat: threeDaysAgo,
      NgayNhanPhong: twoDaysAgo,
      NgayTraPhong: yesterday,
      SoNguoi: 1,
      TienCoc: 300000,
      TrangThai: "Đang sử dụng",
      GhiChu: "Trả trễ - test phí",
      DichVuSuDung: [
        {
          MaDichVu: "DV001",
          SoLuong: 1,
          ThanhTien: 100000,
        },
      ],
      HoaDon: {
        MaHoaDon: `HD${timestamp}002`,
        NgayLap: twoDaysAgo,
        TongTienPhong: 1200000,
        TongTienDichVu: 100000,
        GiamGia: 0,
        TongTien: 1300000,
        TinhTrang: "Chưa thanh toán",
        LichSuThanhToan: [],
      },
    },

    // Booking 3: Đang sử dụng
    {
      MaDatPhong: `DP${timestamp}003`,
      IDKhachHang: "KH1730728866857",
      MaPhong: "P103",
      NgayDat: twoDaysAgo,
      NgayNhanPhong: yesterday,
      NgayTraPhong: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      SoNguoi: 3,
      TienCoc: 600000,
      TrangThai: "Đang sử dụng",
      DichVuSuDung: [],
      HoaDon: {
        MaHoaDon: `HD${timestamp}003`,
        NgayLap: yesterday,
        TongTienPhong: 2400000,
        TongTienDichVu: 0,
        GiamGia: 100000,
        TongTien: 2300000,
        TinhTrang: "Thanh toán một phần",
        LichSuThanhToan: [
          {
            MaThanhToan: `PT${timestamp}003`,
            PhuongThuc: "Chuyển khoản",
            SoTien: 600000,
            NgayThanhToan: yesterday,
            TrangThai: "Thành công",
            GhiChu: "Tiền cọc",
          },
        ],
      },
    },

    // Booking 4: Hoàn thành - 5 sao
    {
      MaDatPhong: `DP${timestamp}004`,
      IDKhachHang: "KH1730728866857",
      MaPhong: "P201",
      NgayDat: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      NgayNhanPhong: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      NgayTraPhong: threeDaysAgo,
      SoNguoi: 2,
      TienCoc: 500000,
      TrangThai: "Hoàn thành",
      DichVuSuDung: [
        {
          MaDichVu: "DV001",
          SoLuong: 3,
          ThanhTien: 300000,
        },
      ],
      HoaDon: {
        MaHoaDon: `HD${timestamp}004`,
        NgayLap: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        TongTienPhong: 3600000,
        TongTienDichVu: 300000,
        GiamGia: 200000,
        TongTien: 3700000,
        TinhTrang: "Đã thanh toán",
        LichSuThanhToan: [
          {
            MaThanhToan: `PT${timestamp}004`,
            PhuongThuc: "Tiền mặt",
            SoTien: 500000,
            NgayThanhToan: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            TrangThai: "Thành công",
          },
          {
            MaThanhToan: `PT${timestamp}005`,
            PhuongThuc: "Thẻ tín dụng",
            SoTien: 3200000,
            NgayThanhToan: threeDaysAgo,
            TrangThai: "Thành công",
          },
        ],
      },
      DanhGia: {
        DiemDanhGia: 5,
        BinhLuan: "Phòng sạch sẽ thoải mái. Nhân viên nhiệt tình!",
        NgayDanhGia: threeDaysAgo,
      },
    },

    // Booking 5: Hoàn thành - 4 sao
    {
      MaDatPhong: `DP${timestamp}005`,
      IDKhachHang: "KH1730728866857",
      MaPhong: "P202",
      NgayDat: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      NgayNhanPhong: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      NgayTraPhong: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      SoNguoi: 1,
      TienCoc: 400000,
      TrangThai: "Hoàn thành",
      DichVuSuDung: [],
      HoaDon: {
        MaHoaDon: `HD${timestamp}005`,
        NgayLap: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        TongTienPhong: 1800000,
        TongTienDichVu: 0,
        GiamGia: 0,
        TongTien: 1800000,
        TinhTrang: "Đã thanh toán",
        LichSuThanhToan: [
          {
            MaThanhToan: `PT${timestamp}006`,
            PhuongThuc: "Chuyển khoản",
            SoTien: 1800000,
            NgayThanhToan: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
            TrangThai: "Thành công",
          },
        ],
      },
      DanhGia: {
        DiemDanhGia: 4,
        BinhLuan: "Phòng tốt view đẹp. Hơi ồn vào tối.",
        NgayDanhGia: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      },
    },

    // Booking 6: Đang sử dụng - Nhiều dịch vụ
    {
      MaDatPhong: `DP${timestamp}006`,
      IDKhachHang: "KH1730728866857",
      MaPhong: "P301",
      NgayDat: twoDaysAgo,
      NgayNhanPhong: yesterday,
      NgayTraPhong: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      SoNguoi: 4,
      TienCoc: 1000000,
      TrangThai: "Đang sử dụng",
      GhiChu: "Gia đình có trẻ nhỏ",
      DichVuSuDung: [
        {
          MaDichVu: "DV001",
          SoLuong: 4,
          ThanhTien: 400000,
        },
        {
          MaDichVu: "DV002",
          SoLuong: 3,
          ThanhTien: 300000,
        },
      ],
      HoaDon: {
        MaHoaDon: `HD${timestamp}006`,
        NgayLap: yesterday,
        TongTienPhong: 4800000,
        TongTienDichVu: 700000,
        GiamGia: 500000,
        TongTien: 5000000,
        TinhTrang: "Thanh toán một phần",
        LichSuThanhToan: [
          {
            MaThanhToan: `PT${timestamp}007`,
            PhuongThuc: "Tiền mặt",
            SoTien: 1000000,
            NgayThanhToan: yesterday,
            TrangThai: "Thành công",
            GhiChu: "Tiền cọc",
          },
        ],
      },
    },
  ];

  return bookings;
}

// Insert test data
async function insertTestData() {
  try {
    const bookings = generateTestBookings();
    console.log(`\n📝 Thêm ${bookings.length} booking...\n`);

    for (const bookingData of bookings) {
      try {
        const existing = await Booking.findOne({
          MaDatPhong: bookingData.MaDatPhong,
        });
        if (existing) {
          console.log(`⚠️  ${bookingData.MaDatPhong} đã tồn tại`);
          continue;
        }

        const booking = new Booking(bookingData);
        await booking.save();

        console.log(
          `✅ ${bookingData.MaDatPhong} - ${bookingData.MaPhong} - ${bookingData.TrangThai}`
        );

        if (bookingData.TrangThai === "Đang sử dụng") {
          const now = new Date();
          const checkoutDate = new Date(bookingData.NgayTraPhong);
          if (now > checkoutDate) {
            const lateHours = Math.ceil(
              (now - checkoutDate) / (1000 * 60 * 60)
            );
            console.log(`   ⚠️  TRẢ TRỄ ${lateHours} giờ`);
          }
        }

        if (bookingData.DanhGia) {
          console.log(`   ⭐ ${bookingData.DanhGia.DiemDanhGia}/5`);
        }
      } catch (error) {
        console.error(`❌ Lỗi ${bookingData.MaDatPhong}:`, error.message);
      }
    }

    console.log("\n✅ Hoàn tất!\n");
  } catch (error) {
    console.error("❌ Lỗi:", error);
    throw error;
  }
}

// Main
async function main() {
  try {
    console.log("🚀 Thêm dữ liệu test Checkout...\n");
    await insertTestData();

    const total = await Booking.countDocuments();
    const active = await Booking.countDocuments({ TrangThai: "Đang sử dụng" });
    const done = await Booking.countDocuments({ TrangThai: "Hoàn thành" });

    console.log("📊 Tổng quan:");
    console.log(`   - Tổng: ${total}`);
    console.log(`   - Đang sử dụng: ${active}`);
    console.log(`   - Hoàn thành: ${done}\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

main();
