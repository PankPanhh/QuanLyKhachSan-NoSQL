// backend/src/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    IDNguoiDung: { type: String, unique: true },
    HoTen: { type: String, required: true },
    NgaySinh: { type: Date },
    GioiTinh: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: 'Khác' },
    SoDienThoai: { type: String },
    Email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    MatKhau: { type: String }, // có thể null đối với khách vãng lai (guest)
    DiaChi: { type: String },
    VaiTro: { type: String, enum: ['Admin', 'NhanVien', 'KhachHang'], default: 'KhachHang' },
    TrangThai: { type: String, default: 'Hoạt động' },
    NgayDangKy: { type: Date, default: Date.now },
    AnhDaiDien: { type: String },
    HangThanhVien: { type: String, enum: ['Silver', 'Gold', 'Platinum'], default: 'Silver' },
    DiemTichLuy: { type: Number, default: 0 },
    isGuest: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    collection: 'NguoiDung',
    toJSON: {
      transform(doc, ret) {
        delete ret.MatKhau;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// helper tạo IDNguoiDung
UserSchema.pre('save', function (next) {
  if (!this.IDNguoiDung) {
    const prefix = this.VaiTro === 'Admin' ? 'AD' : this.VaiTro === 'NhanVien' ? 'NV' : 'KH';
    this.IDNguoiDung = `${prefix}${Date.now()}`;
  }
  next();
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// ===== OtpToken schema/model đưa vào cùng file này =====
const OtpTokenSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    type: {
      type: String,
      enum: ['register', 'staff_register', 'staff_invite', 'admin_setup', 'password_reset'],
      default: 'register'
    },
    otpHash: { type: String, required: true },
    data: { type: Object },

    // Lưu thêm thông tin hồ sơ khi đăng ký
    extra: {
      HoTen: { type: String },
      Email: { type: String },
      MatKhau: { type: String },
      VaiTro: { type: String },
      SoDienThoai: { type: String },
      DiaChi: { type: String },
      NgaySinh: { type: Date },
      AnhDaiDien: { type: String }
    },

    // Trạng thái OTP và kiểm soát gửi lại
    used: { type: Boolean, default: false, index: true },
    usedAt: { type: Date },
    resendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date },

    // Thông tin ngữ cảnh
    ip: { type: String },
    userAgent: { type: String },

    // TTL
    expiresAt: { type: Date, required: true, expires: 0 }
  },
  { timestamps: true, collection: 'OtpToken' }
);

const OtpToken =
  mongoose.models.OtpToken || mongoose.model('OtpToken', OtpTokenSchema);

// Export
export { OtpToken };
export default User;