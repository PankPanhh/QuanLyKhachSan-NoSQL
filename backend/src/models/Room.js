// models/Room.js
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    MaPhong: { type: String, unique: true, required: true }, // P203
    TenPhong: { type: String, required: true }, // Phòng Deluxe Hướng Biển
    LoaiPhong: { type: String, required: true }, // Deluxe, Standard, Suite
    Tang: { type: Number, required: true }, // 2
    GiaPhong: { type: Number, required: true, min: 0 }, // 1500000
    TinhTrang: {
      type: String,
      enum: ["Trống", "Đã đặt", "Đang sử dụng", "Bảo trì"],
      default: "Trống",
    },
    SoGiuong: { type: Number, required: true, min: 1 },
    LoaiGiuong: { type: String }, // King, Queen, Twin
    DienTich: { type: Number }, // 35 (m2)
    MoTa: { type: String },
    HinhAnh: { type: String },

    // Amenities (embedded objects)
    TienNghi: [
      {
        MaTienNghi: { type: String },
        TenTienNghi: { type: String },
        TrangThai: { type: String },
      },
    ],

    // Services available for the room (embedded)
    DichVu: [
      {
        MaDichVu: { type: String },
        TenDichVu: { type: String },
        GiaDichVu: { type: Number },
        DonViTinh: { type: String },
      },
    ],

    // Promotions attached to the room (embedded)
    KhuyenMai: [
      {
        MaKhuyenMai: { type: String },
        TenChuongTrinh: { type: String },
        LoaiKhuyenMai: { type: String },
        GiaTri: { type: Number },
        NgayBatDau: { type: Date },
        NgayKetThuc: { type: Date },
        TrangThai: { type: String },
      },
    ],

    // Additional fields for compatibility with frontend
    // Optional legacy field kept for compatibility
    LoaiTaiSan: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Phong", roomSchema, "Phong");
