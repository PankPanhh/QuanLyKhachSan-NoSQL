import User from '../models/User.js';
import { generateToken } from '../services/jwtService.js';
import { comparePassword } from '../services/hashService.js';
// import { sendEmail } from '../services/emailService.js';

// @desc    Dang ky user moi
// @route   POST /api/v1/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  const { fullName, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email da ton tai' });
    }

    // Hash password da duoc thuc hien boi hook pre-save trong Model
    const user = await User.create({
      fullName,
      email,
      password,
      role, // Nen co logic kiem tra chi Admin moi duoc tao NhanVien
    });

    // TODO: Gui email chao mung
    // await sendEmail(user.email, 'Chao mung ban!', 'Cam on ban da dang ky...', '<h1>Chao mung!</h1>');

    res.status(201).json({
      message: 'Dang ky thanh cong',
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
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
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await comparePassword(password, user.password))) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Email hoac mat khau khong dung' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Lay thong tin user hien tai
// @route   GET /api/v1/auth/me
// @access  Private (yeu cau token)
export const getMe = async (req, res, next) => {
  // req.user da duoc gan boi middleware 'protect'
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(404).json({ message: 'Khong tim thay nguoi dung' });
  }
};
