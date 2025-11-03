import { body } from 'express-validator';
import User from '../models/User.js';
import { hashPassword, hashOtp, compareOtp } from '../services/hashService.js';
import { sendOtpEmail, sendWelcomeEmail } from '../services/emailService.js';
import { generateUserId } from '../utils/generateId.js';

const otpLifetimeMs = 5 * 60 * 1000;

export const registerWithAccountRules = [
  body('name').notEmpty().withMessage('Vui lòng nhập họ tên'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự')
];

export const registerGuestRules = [
  body('name').notEmpty().withMessage('Vui lòng nhập họ tên'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
];

export const verifyOtpAccountRules = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP phải gồm 6 số')
];

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const registerWithAccount = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ Email: email });
    if (exists && exists.isVerified && exists.hasAccount) {
      return next({ status: 409, message: 'Email đã tồn tại' });
    }

    const passwordHash = await hashPassword(password);
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const now = new Date();

    let user;
    if (exists) {
      exists.HoTen = name;
      exists.MatKhau = passwordHash;
      exists.hasAccount = true;
      exists.isVerified = false;
      exists.otpCodeHash = otpHash;
      exists.otpExpires = new Date(now.getTime() + otpLifetimeMs);
      exists.lastOtpSentAt = now;
      user = await exists.save();
    } else {
      user = await User.create({
        IDNguoiDung: generateUserId('KhachHang'),
        HoTen: name,
        Email: email,
        MatKhau: passwordHash,
        VaiTro: 'KhachHang',
        hasAccount: true,
        isVerified: false,
        otpCodeHash: otpHash,
        otpExpires: new Date(now.getTime() + otpLifetimeMs),
        lastOtpSentAt: now,
        TrangThai: 'Hoạt động',
        NgayDangKy: now
      });
    }

    await sendOtpEmail(email, otp, name);
    res.status(200).json({ message: 'Đã gửi OTP đến email. Vui lòng kiểm tra hộp thư/spam.', email: user.Email });
  } catch (err) {
    next(err);
  }
};

export const registerGuest = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;

    const exists = await User.findOne({ Email: email });
    if (exists && exists.hasAccount) {
      return next({ status: 409, message: 'Email này đã có tài khoản' });
    }

    let user;
    if (exists) {
      exists.HoTen = name;
      exists.SoDienThoai = phone || exists.SoDienThoai;
      exists.DiaChi = address || exists.DiaChi;
      exists.hasAccount = false;
      user = await exists.save();
    } else {
      user = await User.create({
        IDNguoiDung: generateUserId('KhachHang'),
        HoTen: name,
        Email: email,
        SoDienThoai: phone || '',
        DiaChi: address || '',
        VaiTro: 'KhachHang',
        hasAccount: false,
        isVerified: false,
        TrangThai: 'Hoạt động'
      });
    }

    res.status(201).json({ message: 'Đăng ký khách vãng lai thành công', user });
  } catch (err) {
    next(err);
  }
};

export const verifyOtpAndCreateAccount = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ Email: email, hasAccount: true });
    if (!user) return next({ status: 404, message: 'Không tìm thấy người dùng' });
    if (!user.otpCodeHash || !user.otpExpires) {
      return next({ status: 400, message: 'Không có OTP cần xác thực' });
    }
    if (new Date() > user.otpExpires) {
      return next({ status: 400, message: 'OTP đã hết hạn. Vui lòng đăng ký lại.' });
    }
    const ok = await compareOtp(otp, user.otpCodeHash);
    if (!ok) return next({ status: 400, message: 'OTP không đúng' });

    user.isVerified = true;
    user.otpCodeHash = undefined;
    user.otpExpires = undefined;
    user.lastOtpSentAt = undefined;
    await user.save();

    await sendWelcomeEmail(user.Email, user.HoTen);
    res.json({ message: 'Xác thực OTP thành công. Tài khoản đã được kích hoạt.' });
  } catch (err) {
    next(err);
  }
};