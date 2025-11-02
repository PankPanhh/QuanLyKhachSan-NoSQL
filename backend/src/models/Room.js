import mongoose from "mongoose";

const TienNghiSchema = new mongoose.Schema({
  MaTienNghi: { type: String, required: true },
  TenTienNghi: { type: String, required: true },
  TrangThai: { type: String, default: "Đang hoạt động" },
});

const DichVuSchema = new mongoose.Schema({
  MaDichVu: { type: String, required: true },
  TenDichVu: { type: String, required: true },
  GiaDichVu: { type: Number, required: true },
  DonViTinh: { type: String },
  HinhAnhDichVu: { type: String },
  MoTaDichVu: { type: String },
  TrangThai: { type: String, default: "Đang hoạt động" },
  ThoiGianPhucVu: { type: String, default: "08:00 - 22:00" },
});

const KhuyenMaiSchema = new mongoose.Schema({
  MaKhuyenMai: { type: String },
  TenChuongTrinh: { type: String },
  LoaiKhuyenMai: { type: String }, // "Phần trăm" hoặc "Giảm giá cố định"
  GiaTri: { type: Number },
  NgayBatDau: { type: Date },
  NgayKetThuc: { type: Date },
  TrangThai: { type: String, default: "Đang hoạt động" },
});

const RoomSchema = new mongoose.Schema(
  {
    MaPhong: { type: String, required: true, unique: true },
    TenPhong: { type: String, required: true },
    LoaiPhong: { type: String, required: true },
    Tang: { type: Number },
    GiaPhong: { type: Number, required: true },
    TinhTrang: {
      type: String,
      enum: ["Trống", "Đã đặt", "Đang sử dụng", "Đang dọn", "Hư", "Bảo trì"],
      default: "Trống",
    },
    SoGiuong: { type: Number },
    LoaiGiuong: { type: String },
    DienTich: { type: Number },
    MoTa: { type: String },
    HinhAnh: [{ type: String }],
    TienNghi: [TienNghiSchema],
    DichVu: [DichVuSchema],
    KhuyenMai: [KhuyenMaiSchema],
  },
  {
    collection: "Phong",
    versionKey: false,
    timestamps: true,
  }
);

export default mongoose.model("Room", RoomSchema);
