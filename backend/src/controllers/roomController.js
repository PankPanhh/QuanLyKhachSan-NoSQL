// controllers/roomController.js
import mongoose from 'mongoose';
import Room from '../models/Room.js';

// Controller: Lấy danh sách phòng (công khai, có phân trang cơ bản)
export const getAllRooms = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter theo schema mới với tên field Vietnamese
    const filter = { LoaiTaiSan: 'Phong' }; // Chỉ lấy phòng, không lấy tiện nghi
    if (req.query.LoaiPhong) filter.LoaiPhong = req.query.LoaiPhong;
    if (req.query.Tang) filter.Tang = Number(req.query.Tang);
    if (req.query.TinhTrang) filter.TinhTrang = req.query.TinhTrang;
    if (req.query.minPrice) filter.GiaPhong = { $gte: Number(req.query.minPrice) };
    if (req.query.maxPrice) {
      filter.GiaPhong = filter.GiaPhong || {};
      filter.GiaPhong.$lte = Number(req.query.maxPrice);
    }

    const [items, count] = await Promise.all([
      Room.find(filter).skip(skip).limit(limit).lean(),
      Room.countDocuments(filter)
    ]);

    const pages = Math.max(1, Math.ceil(count / limit));

    return res.status(200).json({ success: true, data: items, pages });
  } catch (error) {
    console.error('Lỗi getAllRooms:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Controller: tạo phòng (Admin)
export const createRoom = async (req, res) => {
  try {
    const payload = req.body;
    // Đảm bảo có LoaiTaiSan = 'Phong'
    payload.LoaiTaiSan = 'Phong';
    const room = await Room.create(payload);
    return res.status(201).json({ success: true, data: room });
  } catch (error) {
    console.error('Lỗi createRoom:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Controller: cập nhật phòng (Admin)
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    const updated = await Room.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Lỗi updateRoom:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Controller: xóa phòng (Admin)
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    await Room.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Xóa phòng thành công' });
  } catch (error) {
    console.error('Lỗi deleteRoom:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phòng không hợp lệ',
      });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng',
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Lỗi getRoomById:', error); // In lỗi ra console
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
    });
  }
};