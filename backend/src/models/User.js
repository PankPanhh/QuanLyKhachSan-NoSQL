import mongoose from 'mongoose';
import { hashPassword } from '../services/hashService.js';

const userSchema = new mongoose.Schema(
  {
    IDNguoiDung: {
      type: String,
      required: [true, 'ID nguoi dung la bat buoc'],
      unique: true,
    },
    HoTen: {
      type: String,
      required: [true, 'Ho ten la bat buoc'],
    },
    NgaySinh: {
      type: Date,
    },
    GioiTinh: {
      type: String,
      enum: ['Nam', 'Nữ'],
    },
    SoDienThoai: {
      type: String,
    },
    Email: {
      type: String,
      required: [true, 'Email la bat buoc'],
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Email khong hop le'],
    },
    MatKhau: {
      type: String,
      required: [true, 'Mat khau la bat buoc'],
      minlength: [6, 'Mat khau phai co it nhat 6 ky tu'],
    },
    DiaChi: {
      type: String,
    },
    VaiTro: {
      type: String,
      enum: ['KhachHang', 'NhanVien', 'Admin'],
      default: 'KhachHang',
    },
    TrangThai: {
      type: String,
      enum: ['Hoạt động', 'Ngưng hoạt động'],
      default: 'Hoạt động',
    },
    NgayDangKy: {
      type: Date,
      default: Date.now,
    },
    AnhDaiDien: {
      type: String,
    },
    HangThanhVien: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    },
  },
  {
    timestamps: true, // Tu dong them createdAt va updatedAt
  }
);

// Hook (Middleware) cua Mongoose de bam mat khau TRUOC KHI luu
userSchema.pre('save', async function (next) {
  // Chi bam mat khau neu no duoc thay doi (hoac la user moi)
  if (!this.isModified('MatKhau')) {
    return next();
  }
  
  try {
    this.MatKhau = await hashPassword(this.MatKhau);
    next();
  } catch (error) {
    next(error);
  }
});

// Method de kiem tra mat khau
userSchema.methods.matchPassword = async function (enteredPassword) {
  const bcrypt = await import('bcryptjs');
  return await bcrypt.default.compare(enteredPassword, this.MatKhau);
};

const User = mongoose.model('NguoiDung', userSchema, 'NguoiDung');
export default User;
