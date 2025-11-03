// backend/src/controllers/userManagementController.js
import mongoose from 'mongoose';
import User from '../models/User.js';
import {
  getTierByPoints,
  pointsFromRevenue,
  pointsFromBookings,
  recalcTierAndSave
} from '../services/loyaltyService.js';

// Helper: chấp nhận cả Mongo _id lẫn IDNguoiDung (KH..., NV..., AD...)
const byAnyId = (id) =>
  mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { IDNguoiDung: id };

export const adminListUsers = async (req, res, next) => {
  try {
    const { role, rank, status, q, page = 1, limit = 10, minPoints, maxPoints, sort } = req.query;
    const filter = {};
    if (role) filter.VaiTro = role;
    if (rank) filter.HangThanhVien = rank;
    if (status) filter.TrangThai = status;
    if (q) {
      filter.$or = [
        { HoTen: { $regex: q, $options: 'i' } },
        { Email: { $regex: q, $options: 'i' } },
        { SoDienThoai: { $regex: q, $options: 'i' } }
      ];
    }
    const mp = Number(minPoints), xp = Number(maxPoints);
    if (!Number.isNaN(mp) || !Number.isNaN(xp)) {
      filter.DiemTichLuy = {};
      if (!Number.isNaN(mp)) filter.DiemTichLuy.$gte = mp;
      if (!Number.isNaN(xp)) filter.DiemTichLuy.$lte = xp;
    }
    const sortMap = {
      points_desc: { DiemTichLuy: -1 },
      points_asc: { DiemTichLuy: 1 },
      date_desc: { createdAt: -1 },
      date_asc: { createdAt: 1 },
      name_asc: { HoTen: 1 },
      name_desc: { HoTen: -1 }
    };
    const sortOpt = sortMap[sort] || { createdAt: -1 };
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      User.find(filter).sort(sortOpt).skip(skip).limit(Number(limit)),
      User.countDocuments(filter)
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (e) { next(e); }
};

export const adminUpdateStatus = async (req, res, next) => {
  try {
    const { id } = req.params; const { TrangThai } = req.body;
    if (!['Hoạt động', 'Bị khóa'].includes(TrangThai)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }
    const user = await User.findOneAndUpdate(byAnyId(id), { TrangThai }, { new: true });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json({ message: 'Cập nhật trạng thái thành công', user });
  } catch (e) { next(e); }
};

export const adminAddPoints = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const delta = Number(req.body?.delta ?? 0);
    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ message: 'Giá trị điểm không hợp lệ' });
    }
    const user = await User.findOne(byAnyId(id));
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    user.DiemTichLuy = Math.max(0, (user.DiemTichLuy || 0) + delta);
    await recalcTierAndSave(user);
    res.json({ message: `Đã cộng ${delta} điểm`, user });
  } catch (e) { next(e); }
};

export const adminAddPointsByRevenue = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const amount = Number(req.body?.amount ?? 0);
    const user = await User.findOne(byAnyId(id));
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    const pts = pointsFromRevenue(amount);
    if (pts <= 0) return res.status(400).json({ message: 'Doanh thu không hợp lệ' });
    user.DiemTichLuy = Math.max(0, (user.DiemTichLuy || 0) + pts);
    await recalcTierAndSave(user);
    res.json({ message: `Cộng ${pts} điểm theo doanh thu`, user });
  } catch (e) { next(e); }
};

export const adminAddPointsByBookings = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const count = Number(req.body?.count ?? 0);
    const user = await User.findOne(byAnyId(id));
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    const pts = pointsFromBookings(count);
    if (pts <= 0) return res.status(400).json({ message: 'Số lần đặt phòng không hợp lệ' });
    user.DiemTichLuy = Math.max(0, (user.DiemTichLuy || 0) + pts);
    await recalcTierAndSave(user);
    res.json({ message: `Cộng ${pts} điểm từ ${count} lần đặt phòng`, user });
  } catch (e) { next(e); }
};

export const adminRecalcTier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findOne(byAnyId(id));
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    await recalcTierAndSave(user);
    res.json({ message: 'Đã tính lại hạng theo điểm', user });
  } catch (e) { next(e); }
};

export const adminListCustomers = async (req, res, next) => {
  try {
    const {
      rank, status, q, page = 1, limit = 10,
      minPoints, maxPoints, sort
    } = req.query;

    const filter = { VaiTro: 'KhachHang' };
    if (rank) filter.HangThanhVien = rank;                 // Silver | Gold | Platinum
    if (status) filter.TrangThai = status;                  // Hoạt động | Bị khóa
    if (q) {
      filter.$or = [
        { HoTen: { $regex: q, $options: 'i' } },
        { Email: { $regex: q, $options: 'i' } },
        { SoDienThoai: { $regex: q, $options: 'i' } }
      ];
    }
    const mp = Number(minPoints), xp = Number(maxPoints);
    if (!Number.isNaN(mp) || !Number.isNaN(xp)) {
      filter.DiemTichLuy = {};
      if (!Number.isNaN(mp)) filter.DiemTichLuy.$gte = mp;
      if (!Number.isNaN(xp)) filter.DiemTichLuy.$lte = xp;
    }

    const sortMap = {
      points_desc: { DiemTichLuy: -1 },
      points_asc: { DiemTichLuy: 1 },
      date_desc: { createdAt: -1 },
      date_asc: { createdAt: 1 },
      name_asc: { HoTen: 1 },
      name_desc: { HoTen: -1 }
    };
    const sortOpt = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      User.find(filter).sort(sortOpt).skip(skip).limit(Number(limit)),
      User.countDocuments(filter)
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (e) { next(e); }
};