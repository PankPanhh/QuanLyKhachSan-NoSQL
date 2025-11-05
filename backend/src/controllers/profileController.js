import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import { hashPassword, comparePassword } from "../services/hashService.js";

const tierByPoints = (points = 0) => {
  if (points >= 5000) return "Platinum";
  if (points >= 1000) return "Gold";
  return "Silver";
};

export const getMe = async (req, res) => {
  return res.json({ user: req.user });
};

export const updateMe = async (req, res) => {
  const allow = [
    "HoTen",
    "NgaySinh",
    "DiaChi",
    "SoDienThoai",
    "GioiTinh",
    "AnhDaiDien",
  ];
  allow.forEach((k) => {
    if (req.body[k] !== undefined) req.user[k] = req.body[k];
  });
  await req.user.save();
  return res.json({ message: "Cập nhật thành công", user: req.user });
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return res.status(400).json({ message: "Thiếu dữ liệu" });

  const ok = await comparePassword(oldPassword, req.user.MatKhau || "");
  if (!ok) return res.status(400).json({ message: "Mật khẩu cũ không đúng" });

  req.user.MatKhau = await hashPassword(newPassword);
  await req.user.save();
  return res.json({ message: "Đổi mật khẩu thành công" });
};

export const listUsers = async (req, res) => {
  const { role, status, rank, q, page = 1, limit = 10 } = req.query;
  const filter = {};
  if (role) filter.VaiTro = role;
  if (status) filter.TrangThai = status;
  if (rank) filter.HangThanhVien = rank;
  if (q) {
    filter.$or = [
      { HoTen: { $regex: q, $options: "i" } },
      { Email: { $regex: q, $options: "i" } },
      { SoDienThoai: { $regex: q, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), limit: Number(limit) });
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { TrangThai } = req.body;
  if (!["Hoạt động", "Bị khóa"].includes(TrangThai)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }
  const user = await User.findByIdAndUpdate(id, { TrangThai }, { new: true });
  if (!user)
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  res.json({ message: "Cập nhật trạng thái thành công", user });
};

export const addPoints = async (req, res) => {
  const { id } = req.params;
  const { delta = 0 } = req.body;
  const user = await User.findById(id);
  if (!user)
    return res.status(404).json({ message: "Không tìm thấy người dùng" });

  user.DiemTichLuy = Math.max(0, (user.DiemTichLuy || 0) + Number(delta));
  user.HangThanhVien = tierByPoints(user.DiemTichLuy);
  await user.save();

  res.json({ message: "Cộng điểm thành công", user });
};

// Lấy lịch sử đặt phòng của chính user đang đăng nhập
export const getMyBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      q,
      from,
      to,
      sort = "NgayDat",
    } = req.query;

    // IDKhachHang trong collection DatPhong lưu mã khách hàng (IDNguoiDung)
    const customerId = req.user?.IDNguoiDung || req.user?._id?.toString();
    if (!customerId)
      return res.status(400).json({ message: "Không có thông tin người dùng" });

    const filter = { IDKhachHang: customerId };
    if (status) filter.TrangThai = status;
    if (q) {
      // tìm theo mã đặt phòng hoặc mã phòng
      filter.$or = [
        { MaDatPhong: { $regex: q, $options: "i" } },
        { MaPhong: { $regex: q, $options: "i" } },
      ];
    }

    if (from || to) {
      filter.NgayDat = {};
      if (from) filter.NgayDat.$gte = new Date(from);
      if (to) filter.NgayDat.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Booking.find(filter)
        .sort({ [sort]: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Booking.countDocuments(filter),
    ]);

    // Đính kèm thông tin phòng (nếu cần) — lấy tất cả mã phòng trong page và query Room 1 lần
    const maPhongs = [...new Set(items.map((b) => b.MaPhong).filter(Boolean))];
    const rooms = maPhongs.length
      ? await Room.find({ MaPhong: { $in: maPhongs } }).lean()
      : [];
    const roomMap = rooms.reduce((acc, r) => {
      acc[r.MaPhong] = r;
      return acc;
    }, {});

    const itemsWithRoom = items.map((b) => ({
      ...b,
      Room: roomMap[b.MaPhong] || null,
    }));

    return res.json({
      items: itemsWithRoom,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error("getMyBookings error:", err);
    return res.status(500).json({ message: "Lỗi khi lấy lịch sử đặt phòng" });
  }
};
