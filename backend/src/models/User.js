import mongoose from 'mongoose';
import { hashPassword } from '../services/hashService.js';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Ho ten la bat buoc'],
    },
    email: {
      type: String,
      required: [true, 'Email la bat buoc'],
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Email khong hop le'],
    },
    password: {
      type: String,
      required: [true, 'Mat khau la bat buoc'],
      minlength: [6, 'Mat khau phai co it nhat 6 ky tu'],
    },
    role: {
      type: String,
      enum: ['KhachHang', 'NhanVien', 'Admin'],
      default: 'KhachHang',
    },
    phoneNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    // Them cac truong khac neu can
  },
  {
    timestamps: true, // Tu dong them createdAt va updatedAt
  }
);

// Hook (Middleware) cua Mongoose de bam mat khau TRUOC KHI luu
userSchema.pre('save', async function (next) {
  // Chi bam mat khau neu no duoc thay doi (hoac la user moi)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
export default User;
