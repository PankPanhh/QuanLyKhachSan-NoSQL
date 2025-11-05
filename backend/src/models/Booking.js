import mongoose from "mongoose";

const hoaDonSchema = new mongoose.Schema({
  MaHoaDon: { type: String, required: true },
  NgayLap: { type: Date },
  TongTienPhong: { type: Number, required: true },
  TongTienDichVu: { type: Number, default: 0 },
  GiamGia: { type: Number, default: 0 },
  TongTien: { type: Number, required: true },
  TinhTrang: {
    type: String,
    enum: ["Chưa thanh toán", "Đã thanh toán", "Thanh toán một phần"],
    default: "Chưa thanh toán",
  },
  GhiChu: { type: String },
  DaXuatHoaDon: { type: Boolean, default: false }, // Flag đánh dấu đã xuất hóa đơn
  NgayXuatHoaDon: { type: Date }, // Ngày xuất hóa đơn
  LichSuThanhToan: [
    {
      MaThanhToan: { type: String, required: true },
      PhuongThuc: {
        type: String,
        enum: [
          "Tiền mặt",
          "Chuyển khoản",
          "Thẻ tín dụng",
          "PayPal",
          "Ví điện tử",
        ],
        default: "Tiền mặt",
      },
      SoTien: { type: Number, required: true },
      NgayThanhToan: { type: Date, required: true },
      TrangThai: {
        type: String,
        enum: ["Thành công", "Thất bại", "Đang xử lý"],
        default: "Thành công",
      },
      GhiChu: { type: String },
    },
  ],
});

const dichVuSuDungSchema = new mongoose.Schema({
  MaDichVu: { type: String, required: true },
  SoLuong: { type: Number, required: true, min: 1 },
  ThanhTien: { type: Number, required: true },
});

const danhGiaSchema = new mongoose.Schema({
  DiemDanhGia: { type: Number, min: 1, max: 5 },
  BinhLuan: { type: String },
  NgayDanhGia: { type: Date, default: Date.now },
});

const bookingSchema = new mongoose.Schema(
  {
    MaDatPhong: {
      type: String,
      required: true,
      unique: true,
    },
    IDKhachHang: {
      type: String, // Reference to NguoiDung.IDNguoiDung
      required: true,
    },
    MaPhong: {
      type: String, // Reference to Phong.MaPhong
      required: true,
    },
    NgayDat: {
      type: Date,
      required: true,
      default: Date.now,
    },
    NgayNhanPhong: {
      type: Date,
      required: true,
    },
    NgayTraPhong: {
      type: Date,
      required: true,
    },
    SoNguoi: {
      type: Number,
      required: true,
      min: 1,
    },
    TienCoc: {
      type: Number,
      default: 0,
    },
    TrangThai: {
      type: String,
      // Include 'Đang sử dụng' for confirmed-in-use and 'Phòng trống' when a booking is cancelled
      enum: ["Đang chờ", "Đã xác nhận", "Đang sử dụng", "Đã hủy", "Hoàn thành"],
      default: "Đang chờ",
    },
    GhiChu: {
      type: String,
    },
    DichVuSuDung: [dichVuSuDungSchema],
    HoaDon: hoaDonSchema,
    DanhGia: danhGiaSchema,
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("DatPhong", bookingSchema, "DatPhong");
export default Booking;
