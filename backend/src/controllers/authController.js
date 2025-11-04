import { body } from 'express-validator';
import User from '../models/User.js';
import { OtpToken } from '../models/User.js';
import { hashPassword, comparePassword, hashOtp, compareOtp } from '../services/hashService.js';
import { signToken } from '../services/jwtService.js';
import { sendOtpEmail, sendWelcomeEmail } from '../services/emailService.js';

// Helpers
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const OTP_EXPIRES_MIN = 5;

export const validators = {
  registerWithAccount: [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    // THÊM các field tuỳ chọn
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('birthDate').optional().isISO8601().withMessage('Ngày sinh không hợp lệ'),
    body('avatarBase64').optional().isString()
  ],
  verifyOtpAccount: [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  registerGuest: [
    body('name').trim().notEmpty(),
    body('email').isEmail().withMessage('Valid email required')
  ],
  login: [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  forgotPassword: [
    body('email').isEmail().withMessage('Valid email required')
  ],
  resetPassword: [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password min 6 chars')
  ],
  createStaff: [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
  ]
};

// Staff register (tùy chọn)
export const staffRegisterWithAccount = async (req, res) => {
  const { name, email, password } = req.body;
  const existed = await User.findOne({ Email: email.toLowerCase() });
  if (existed) return res.status(400).json({ message: 'Email đã tồn tại' });

  const otp = generateOtp();
  const otpHashed = await hashOtp(otp);
  const passwordHash = await hashPassword(password);
  const expires = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);

  await OtpToken.deleteMany({ email: email.toLowerCase(), type: 'staff_register' });
  await OtpToken.create({
    email: email.toLowerCase(),
    type: 'staff_register',
    otpHash: otpHashed,
    data: { HoTen: name, Email: email.toLowerCase(), MatKhau: passwordHash, VaiTro: 'NhanVien' },
    expiresAt: expires
  });

  await sendOtpEmail(email, otp);
  return res.json({ message: 'Đã gửi OTP tới email (5 phút).' });
};

// 1) Lựa chọn 1: đăng ký có tài khoản (OTP)
export const registerWithAccount = async (req, res) => {
  // THÊM destructuring các trường bổ sung
  const { name, email, password, phone, address, birthDate, avatarBase64 } = req.body;

  const existed = await User.findOne({ Email: email.toLowerCase() });
  if (existed) return res.status(400).json({ message: 'Email đã tồn tại' });

  const otp = generateOtp();
  const otpHashed = await hashOtp(otp);
  const passwordHash = await hashPassword(password);
  const expires = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);

  await OtpToken.deleteMany({ email: email.toLowerCase(), type: 'register' });
  await OtpToken.create({
    email: email.toLowerCase(),
    type: 'register',
    otpHash: otpHashed,
    // THÊM đầy đủ thông tin vào data để tạo user sau khi verify
    data: {
      HoTen: name,
      Email: email.toLowerCase(),
      MatKhau: passwordHash,
      VaiTro: 'KhachHang',
      SoDienThoai: phone || '',
      DiaChi: address || '',
      NgaySinh: birthDate ? new Date(birthDate) : undefined,
      AnhDaiDien: avatarBase64 || ''
    },
    expiresAt: expires
  });

  await sendOtpEmail(email, otp);
  return res.json({ message: 'Đã gửi OTP tới email (5 phút).' });
};

// 2) Xác nhận OTP và tạo tài khoản
export const verifyOtpAndCreateAccount = async (req, res) => {
  const { email, otp } = req.body;
  const tokenDoc = await OtpToken.findOne({ email: email.toLowerCase(), type: { $in: ['register', 'staff_register'] } });
  if (!tokenDoc) return res.status(400).json({ message: 'OTP không tồn tại hoặc đã hết hạn' });

  const matched = await compareOtp(otp, tokenDoc.otpHash);
  if (!matched) return res.status(400).json({ message: 'OTP không đúng' });

  const existed = await User.findOne({ Email: email.toLowerCase() });
  if (existed) {
    await OtpToken.deleteOne({ _id: tokenDoc._id });
    return res.status(400).json({ message: 'Email đã tồn tại' });
  }

  const payload = tokenDoc.data || {};
  // THÊM: chuẩn hoá dữ liệu bổ sung
  const soDienThoai = payload.SoDienThoai || '';
  const diaChi = payload.DiaChi || '';
  const ngaySinh = payload.NgaySinh ? new Date(payload.NgaySinh) : undefined;
  const anhDaiDien = payload.AnhDaiDien || '';

  const user = await User.create({
    HoTen: payload.HoTen,
    NgaySinh: ngaySinh,
    SoDienThoai: soDienThoai,
    Email: payload.Email,
    MatKhau: payload.MatKhau,
    DiaChi: diaChi,
    VaiTro: payload.VaiTro || 'KhachHang',
    TrangThai: 'Hoạt động',
    AnhDaiDien: anhDaiDien
  });

  await OtpToken.deleteOne({ _id: tokenDoc._id });
  await sendWelcomeEmail(user.Email, user.HoTen);
  return res.json({ message: 'Tạo tài khoản thành công. Hãy đăng nhập.' });
};

// 3) Lựa chọn 2: khách vãng lai (không tạo tài khoản)
export const registerGuest = async (req, res) => {
  const { name, email, phone, address } = req.body;

  const existed = await User.findOne({ Email: email.toLowerCase() });
  if (existed && existed.MatKhau) {
    return res.status(400).json({ message: 'Email đã tồn tại như một tài khoản' });
  }

  let user = await User.findOne({ Email: email.toLowerCase() });
  if (user) {
    user.HoTen = name || user.HoTen;
    user.SoDienThoai = phone || user.SoDienThoai;
    user.DiaChi = address || user.DiaChi;
    user.isGuest = true;
    await user.save();
  } else {
    user = await User.create({
      HoTen: name,
      Email: email.toLowerCase(),
      SoDienThoai: phone || '',
      DiaChi: address || '',
      VaiTro: 'KhachHang',
      isGuest: true,
      TrangThai: 'Hoạt động'
    });
  }

  return res.json({ message: 'Đã lưu thông tin khách hàng (guest).', user });
};

// Alias cũ (giữ tương thích)
export const register = registerWithAccount;
export const verifyOtp = verifyOtpAndCreateAccount;

// 5) Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ Email: email.toLowerCase() });
  if (!user) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });

  if (!user.MatKhau) return res.status(400).json({ message: 'Tài khoản này không có mật khẩu. Hãy tạo tài khoản.' });
  if (user.TrangThai !== 'Hoạt động') return res.status(403).json({ message: 'Tài khoản bị khóa hoặc không hoạt động' });

  const ok = await comparePassword(password, user.MatKhau);
  if (!ok) return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });

  const token = signToken({ id: user._id, role: user.VaiTro });
  return res.json({ token, user });
};

// 6) Check role
export const checkRole = async (req, res) => {
  const user = req.user;
  return res.json({ role: user.VaiTro, user });
};

// 7) Quên mật khẩu: gửi OTP
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ Email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

  const otp = generateOtp();
  const otpHashed = await hashOtp(otp);
  const expires = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);

  await OtpToken.deleteMany({ email: email.toLowerCase(), type: 'password_reset' });
  await OtpToken.create({
    email: email.toLowerCase(),
    type: 'password_reset',
    otpHash: otpHashed,
    data: { uid: user._id },
    expiresAt: expires
  });

  await sendOtpEmail(email, otp);
  return res.json({ message: 'Đã gửi OTP đặt lại mật khẩu (5 phút).' });
};

// 8) Reset mật khẩu bằng OTP
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const tokenDoc = await OtpToken.findOne({ email: email.toLowerCase(), type: 'password_reset' });
  if (!tokenDoc) return res.status(400).json({ message: 'OTP không tồn tại hoặc đã hết hạn' });

  const matched = await compareOtp(otp, tokenDoc.otpHash);
  if (!matched) return res.status(400).json({ message: 'OTP không đúng' });

  const user = await User.findOne({ Email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

  user.MatKhau = await hashPassword(newPassword);
  user.isGuest = false;
  await user.save();
  await OtpToken.deleteOne({ _id: tokenDoc._id });

  return res.json({ message: 'Đặt lại mật khẩu thành công. Hãy đăng nhập.' });
};