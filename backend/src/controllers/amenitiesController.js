import Room from '../models/Room.js';

// No separate collection or file. The "common" amenities list is derived from
// embedded `TienNghi` arrays across `Room` documents. Endpoints below operate
// on those embedded entries. To create a new amenity you must assign it to at
// least one room or to all rooms (assignToAll=true). This keeps everything in
// the existing `rooms` collection and avoids new storage.

const getNextAmenitySeq = async () => {
  try {
    const codes = await Room.distinct('TienNghi.MaTienNghi', { 'TienNghi.MaTienNghi': { $exists: true } });
    let max = 0;
    for (const c of (codes || [])) {
      if (!c) continue;
      const m = String(c).match(/^TN(\d+)$/i);
      if (m && m[1]) {
        const n = parseInt(m[1], 10);
        if (!Number.isNaN(n) && n > max) max = n;
      }
    }
    return max + 1;
  } catch (e) {
    return 1;
  }
};

// GET: list "common" amenities by aggregating rooms
export const getAllAmenities = async (req, res) => {
  try {
    const agg = await Room.aggregate([
      { $match: { TienNghi: { $exists: true, $ne: [] } } },
      { $unwind: '$TienNghi' },
      { $group: {
        _id: '$TienNghi.MaTienNghi',
        MaTienNghi: { $first: '$TienNghi.MaTienNghi' },
        TenTienNghi: { $first: '$TienNghi.TenTienNghi' },
        TrangThai: { $first: '$TienNghi.TrangThai' },
        countRooms: { $sum: 1 }
      } },
      { $project: { _id: 0, MaTienNghi: 1, TenTienNghi: 1, TrangThai: 1, countRooms: 1 } },
      { $sort: { MaTienNghi: 1 } }
    ]).allowDiskUse(true);
    return res.status(200).json({ success: true, data: agg });
  } catch (error) {
    console.error('getAllAmenities error', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Create: must assign to some rooms or to all rooms (assignToAll flag)
export const createAmenity = async (req, res) => {
  try {
    const { TenTienNghi, TrangThai, roomIds, assignToAll } = req.body;
    if (!TenTienNghi) return res.status(400).json({ success: false, message: 'TenTienNghi là bắt buộc' });
    // generate code
    const seq = await getNextAmenitySeq();
    const MaTienNghi = `TN${String(seq).padStart(3, '0')}`;
    const amenObj = { MaTienNghi, TenTienNghi, TrangThai: TrangThai || 'Hoạt động' };

    if (!assignToAll && (!Array.isArray(roomIds) || roomIds.length === 0)) {
      return res.status(400).json({ success: false, message: 'Vì không có storage riêng, vui lòng cung cấp roomIds hoặc assignToAll=true để gán tiện nghi này.' });
    }

    if (assignToAll) {
      await Room.updateMany({ 'TienNghi.MaTienNghi': { $ne: MaTienNghi } }, { $push: { TienNghi: amenObj } });
    } else {
      for (const rid of roomIds) {
        try {
          await Room.updateOne({ _id: rid, 'TienNghi.MaTienNghi': { $ne: MaTienNghi } }, { $push: { TienNghi: amenObj } });
        } catch (e) { /* ignore per-room errors */ }
      }
    }

    return res.status(201).json({ success: true, data: amenObj });
  } catch (error) {
    console.error('createAmenity error', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Update: change name/status across all rooms that reference this MaTienNghi
export const updateAmenity = async (req, res) => {
  try {
    const { code } = req.params;
    const { TenTienNghi, TrangThai } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Thiếu mã tiện nghi' });
    const update = {};
    if (TenTienNghi !== undefined) update['TienNghi.$[elem].TenTienNghi'] = TenTienNghi;
    if (TrangThai !== undefined) update['TienNghi.$[elem].TrangThai'] = TrangThai;
    if (Object.keys(update).length === 0) return res.status(400).json({ success: false, message: 'Không có trường để cập nhật' });
    await Room.updateMany({ 'TienNghi.MaTienNghi': code }, { $set: update }, { arrayFilters: [{ 'elem.MaTienNghi': code }] });
    // Return the updated representation by querying one example
    const sample = await Room.findOne({ 'TienNghi.MaTienNghi': code }, { 'TienNghi.$': 1 }).lean();
    const returned = sample && sample.TienNghi && sample.TienNghi.length ? sample.TienNghi[0] : { MaTienNghi: code, TenTienNghi: TenTienNghi || '', TrangThai: TrangThai || '' };
    return res.status(200).json({ success: true, data: returned });
  } catch (error) {
    console.error('updateAmenity error', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Delete: remove amenity from rooms if cascade=true; otherwise instruct caller
export const deleteAmenity = async (req, res) => {
  try {
    const { code } = req.params;
    const { cascade } = req.query;
    if (!code) return res.status(400).json({ success: false, message: 'Thiếu mã tiện nghi' });
    if (cascade === 'true' || cascade === '1') {
      const resUpdate = await Room.updateMany({}, { $pull: { TienNghi: { MaTienNghi: code } } });
      const modified = (resUpdate && (resUpdate.modifiedCount ?? resUpdate.nModified ?? 0)) || 0;
      return res.status(200).json({ success: true, message: 'Đã xóa tiện nghi khỏi các phòng', modifiedCount: modified });
    }
    return res.status(400).json({ success: false, message: 'Không có storage riêng—để xóa khỏi "danh sách chung" bạn phải xóa khỏi các phòng (gửi ?cascade=true để xóa).' });
  } catch (error) {
    console.error('deleteAmenity error', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Assign amenity (by MaTienNghi) to a specific room. If amenity details exist
// in some room, reuse them; otherwise require TenTienNghi in body.
export const assignAmenityToRoom = async (req, res) => {
  try {
    const { code, roomId } = req.params;
    const { TenTienNghi, TrangThai } = req.body;
    // Try to find an existing amenity detail from rooms
    const sample = await Room.findOne({ 'TienNghi.MaTienNghi': code }, { 'TienNghi.$': 1 }).lean();
    let amenObj = null;
    if (sample && sample.TienNghi && sample.TienNghi.length) {
      amenObj = sample.TienNghi[0];
    } else {
      if (!TenTienNghi) return res.status(400).json({ success: false, message: 'Tiện nghi chưa tồn tại; cung cấp TenTienNghi trong body để gán.' });
      amenObj = { MaTienNghi: code, TenTienNghi, TrangThai: TrangThai || 'Hoạt động' };
    }
    const resUpdate = await Room.updateOne({ _id: roomId, 'TienNghi.MaTienNghi': { $ne: code } }, { $push: { TienNghi: amenObj } });
    if (resUpdate.modifiedCount === 0 && (!resUpdate.nModified || resUpdate.nModified === 0)) {
      const existsRoom = await Room.findById(roomId).lean();
      if (!existsRoom) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
      return res.status(200).json({ success: true, message: 'Tiện nghi đã có trong phòng hoặc đã tồn tại', data: amenObj });
    }
    return res.status(200).json({ success: true, message: 'Đã gán tiện nghi cho phòng', data: amenObj });
  } catch (error) {
    console.error('assignAmenityToRoom error', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Remove amenity from a room (by MaTienNghi)
export const removeAmenityFromRoom = async (req, res) => {
  try {
    const { code, roomId } = req.params;
    const resUpdate = await Room.updateOne({ _id: roomId }, { $pull: { TienNghi: { MaTienNghi: code } } });
    const modified = (resUpdate && (resUpdate.modifiedCount ?? resUpdate.nModified ?? 0)) || 0;
    return res.status(200).json({ success: true, modifiedCount: modified });
  } catch (error) {
    console.error('removeAmenityFromRoom error', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
