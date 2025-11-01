// models/Room.js
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  MaPhong: { type: String, unique: true, required: true }, // P203
  TenPhong: { type: String, required: true }, // Phòng Deluxe Hướng Biển
  LoaiPhong: { type: String, required: true }, // Deluxe, Standard, Suite
  Tang: { type: Number, required: true }, // 2
  GiaPhong: { type: Number, required: true, min: 0 }, // 1500000
  TinhTrang: { 
    type: String, 
    enum: ['Trống', 'Đã đặt', 'Đang sử dụng', 'Bảo trì'], 
    default: 'Trống' 
  },
  SoGiuong: { type: Number, required: true, min: 1 },
  LoaiGiuong: { type: String }, // King, Queen, Twin
  DienTich: { type: Number }, // 35 (m2)
  MoTa: { type: String },
  HinhAnh: { type: String },
  
  // References to amenities and promotions by their codes
  MaTienNghi: [{ type: String }], // ["TN001", "TN002", ...]
  MaKhuyenMai: [{ type: String }], // ["KM_HE20", ...]
  
  // Additional fields for compatibility with frontend
  LoaiTaiSan: { type: String, default: 'Phong' },
}, { timestamps: true });

export default mongoose.model('Phong', roomSchema, 'Phong');