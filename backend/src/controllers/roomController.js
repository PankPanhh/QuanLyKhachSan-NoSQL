import Room from '../models/Room.js';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import Booking from '../models/Booking.js';

// GET /api/v1/rooms - list rooms
export const getAllRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({}).sort({ TenPhong: 1 }).lean();
    return res.status(200).json(rooms);
  } catch (error) {
    console.error('Error getAllRooms:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// GET /api/v1/rooms/available
export const getAvailableRooms = async (req, res, next) => {
  try {
    // If checkIn/checkOut provided, compute availability by checking overlapping bookings
    const { checkIn, checkOut } = req.query;
    if (checkIn && checkOut) {
      const ci = new Date(checkIn);
      const co = new Date(checkOut);
      if (isNaN(ci.getTime()) || isNaN(co.getTime()) || ci >= co) {
        return res.status(400).json({ success: false, message: 'Invalid checkIn/checkOut' });
      }

      // Find bookings that overlap [ci, co)
      const overlapping = await Booking.find({
        TrangThai: { $ne: 'Đã hủy' },
        NgayNhanPhong: { $lt: co },
        NgayTraPhong: { $gt: ci },
      }).distinct('MaPhong');

      const rooms = await Room.find({ MaPhong: { $nin: overlapping } }).sort({ TenPhong: 1 }).lean();
      return res.status(200).json(rooms);
    }

    // Fallback: return rooms marked as 'Trống'
    const rooms = await Room.find({ TinhTrang: 'Trống' }).sort({ TenPhong: 1 }).lean();
    return res.status(200).json(rooms);
  } catch (error) {
    console.error('Error getAvailableRooms:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Helper: resolve id param as ObjectId or MaPhong
const findRoomFilter = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) return { _id: id };
  return { MaPhong: id };
};

// GET /api/v1/rooms/:id
export const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filter = findRoomFilter(id);
    if (!filter) return res.status(400).json({ success: false, message: 'Thiếu id' });
    const room = await Room.findOne(filter).lean();
    if (!room) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
    return res.status(200).json({ success: true, data: room });
  } catch (error) {
    console.error('Error getRoomById:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// POST /api/v1/rooms
export const createRoom = async (req, res, next) => {
  try {
    const required = ['MaPhong', 'TenPhong', 'LoaiPhong', 'GiaPhong'];
    const missing = required.filter((k) => !Object.hasOwn(req.body, k) || req.body[k] === '' || req.body[k] === null);
    if (missing.length) return res.status(400).json({ success: false, message: 'Missing fields', missing });

    const room = await Room.create(req.body);
    return res.status(201).json({ success: true, data: room });
  } catch (error) {
    console.error('Error createRoom:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// PUT /api/v1/rooms/:id
export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filter = findRoomFilter(id);
    if (!filter) return res.status(400).json({ success: false, message: 'Thiếu id' });
    const updated = await Room.findOneAndUpdate(filter, { $set: req.body }, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để cập nhật' });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updateRoom:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// DELETE /api/v1/rooms/:id
export const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filter = findRoomFilter(id);
    if (!filter) return res.status(400).json({ success: false, message: 'Thiếu id' });
    const del = await Room.findOneAndDelete(filter).lean();
    if (!del) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để xóa' });
    return res.status(200).json({ success: true, message: 'Đã xóa phòng', data: del });
  } catch (error) {
    console.error('Error deleteRoom:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// PUT /api/v1/rooms/:id/image - upload/overwrite image (multer memory storage expected)
export const uploadRoomImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Không có file' });
    const { id } = req.params;
    const filter = findRoomFilter(id);
    if (!filter) return res.status(400).json({ success: false, message: 'Thiếu id' });

    const filename = `${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
    const imagesDir = path.join(process.cwd(), 'src', 'assets', 'images', 'room');
    await fs.mkdir(imagesDir, { recursive: true });
    const dest = path.join(imagesDir, filename);
    await fs.writeFile(dest, req.file.buffer);

    // Push to HinhAnh array
    const updated = await Room.findOneAndUpdate(filter, { $push: { HinhAnh: filename } }, { new: true }).lean();
    return res.status(200).json({ success: true, filename, data: updated });
  } catch (error) {
    console.error('Error uploadRoomImage:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};
