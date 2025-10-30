import User from '../models/User.js';
import { generateToken } from '../services/jwtService.js';
import { comparePassword } from '../services/hashService.js';
// import { sendEmail } from '../services/emailService.js';

// @desc    Dang ky user moi
// @route   POST /api/v1/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const { HoTen, Email, MatKhau, VaiTro, IDNguoiDung, SoDienThoai, DiaChi } = req.body;

  try {
    const userExists = await User.findOne({ Email });
    if (userExists) {
      return res.status(400).json({ message: 'Email da ton tai' });
    }

    // Hash password da duoc thuc hien boi hook pre-save trong Model
    const user = await User.create({
      IDNguoiDung: IDNguoiDung || `KH${Date.now()}`, // Generate ID if not provided
      HoTen,
      Email,
      MatKhau,
      VaiTro: VaiTro || 'KhachHang', // Default role
      SoDienThoai,
      DiaChi,
      TrangThai: 'Hoạt động',
    });

    // TODO: Gui email chao mung
    // await sendEmail(user.Email, 'Chao mung ban!', 'Cam on ban da dang ky...', '<h1>Chao mung!</h1>');

    res.status(201).json({
      message: 'Dang ky thanh cong',
      _id: user._id,
      HoTen: user.HoTen,
      Email: user.Email,
      VaiTro: user.VaiTro,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dang nhap user
// @route   POST /api/v1/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  const { Email, MatKhau } = req.body;

  try {
    if (!Email || !MatKhau) {
      return res.status(400).json({ message: 'Vui long nhap email va mat khau' });
    }

    // Tim user trong database
    const user = await User.findOne({ Email });
    
    if (!user) {
      return res.status(400).json({ message: 'Email hoac mat khau khong dung' });
    }

    // Check user co active khong
    if (user.TrangThai !== 'Hoạt động') {
      return res.status(400).json({ message: 'Tai khoan da bi khoa' });
    }

    // Kiem tra password
    const isPasswordMatch = await user.matchPassword(MatKhau);
    
    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Email hoac mat khau khong dung' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Dang nhap thanh cong',
      _id: user._id,
      HoTen: user.HoTen,
      Email: user.Email,
      VaiTro: user.VaiTro,
      token: token,
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    next(error);
  }
};

// @desc    Lay thong tin user hien tai
// @route   GET /api/v1/auth/me
// @access  Private (yeu cau token)
export const getMe = async (req, res, next) => {
  // req.user da duoc gan boi middleware 'protect'
  if (req.user) {
    res.json({
      _id: req.user._id,
      IDNguoiDung: req.user.IDNguoiDung,
      HoTen: req.user.HoTen,
      Email: req.user.Email,
      VaiTro: req.user.VaiTro,
      SoDienThoai: req.user.SoDienThoai,
      DiaChi: req.user.DiaChi,
      TrangThai: req.user.TrangThai,
      NgayTao: req.user.NgayTao,
    });
  } else {
    res.status(404).json({ message: 'Khong tim thay nguoi dung' });
  }
};
