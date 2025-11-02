import Room from '../models/Room.js';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import Booking from '../models/Booking.js';

// Helper: find a Service either by ObjectId or by MaDichVu code
const findServiceByParam = async (param) => {
  if (!param) return null;
  // If param looks like an ObjectId, try to match embedded DichVu by its _id
  if (mongoose.Types.ObjectId.isValid(param)) {
    const roomHitByElemId = await Room.findOne({ 'DichVu._id': param }, { 'DichVu.$': 1 }).lean();
    if (roomHitByElemId && roomHitByElemId.DichVu && roomHitByElemId.DichVu.length) {
      return roomHitByElemId.DichVu[0];
    }
  }
  // Treat param as MaDichVu and find embedded service inside any Room
  const roomHit = await Room.findOne({ 'DichVu.MaDichVu': param }, { 'DichVu.$': 1 }).lean();
  if (roomHit && roomHit.DichVu && roomHit.DichVu.length) {
    // return the embedded service object as-is
    return roomHit.DichVu[0];
  }
  return null;
};

// @desc    Lay tat ca dich vu
// @route   GET /api/v1/services
// @access  Public
export const getAllServices = async (req, res, next) => {
  try {
    // Prefer extracting embedded DichVu documents from Room (Phong) collection
    // The DB sample shows services are embedded in rooms under `DichVu`.
    const aggregated = await Room.aggregate([
      { $match: { DichVu: { $exists: true, $ne: [] } } },
      { $unwind: '$DichVu' },
      // Collect lists for fields so we can pick the first non-null value across rooms
      {
        $group: {
          _id: '$DichVu.MaDichVu',
          MaDichVu: { $first: '$DichVu.MaDichVu' },
          TenDichVu: { $first: '$DichVu.TenDichVu' },
          GiaDichVu: { $first: '$DichVu.GiaDichVu' },
          DonViTinh: { $first: '$DichVu.DonViTinh' },
          HinhList: { $push: '$DichVu.HinhAnhDichVu' },
          MoTaList: { $push: '$DichVu.MoTaDichVu' },
          TrangThaiList: { $push: '$DichVu.TrangThai' },   
          ThoiGianList: { $push: '$DichVu.ThoiGianPhucVu' },
          ElemId: { $first: '$DichVu._id' },
          countRooms: { $sum: 1 },
        },
      },
      // Project first non-empty value from each list (prefer non-null, non-empty)
      {
        $project: {
          _id: '$ElemId',
          MaDichVu: 1,
          TenDichVu: 1,
          GiaDichVu: 1,
          DonViTinh: 1,
          countRooms: 1,
          HinhAnhDichVu: {
            $let: {
              vars: { filtered: { $filter: { input: '$HinhList', as: 'it', cond: { $and: [{ $ne: ['$$it', null] }, { $ne: ['$$it', ''] }] } } } },
              in: { $cond: [{ $gt: [{ $size: '$$filtered' }, 0] }, { $arrayElemAt: ['$$filtered', 0] }, null] }
            }
          },
          MoTaDichVu: {
            $let: {
              vars: { filtered: { $filter: { input: '$MoTaList', as: 'it', cond: { $and: [{ $ne: ['$$it', null] }, { $ne: ['$$it', ''] }] } } } },
              in: { $cond: [{ $gt: [{ $size: '$$filtered' }, 0] }, { $arrayElemAt: ['$$filtered', 0] }, null] }
            }
          },
          TrangThai: {
            $let: {
              vars: { filtered: { $filter: { input: '$TrangThaiList', as: 'it', cond: { $and: [{ $ne: ['$$it', null] }, { $ne: ['$$it', ''] }] } } } },
              in: { $cond: [{ $gt: [{ $size: '$$filtered' }, 0] }, { $arrayElemAt: ['$$filtered', 0] }, null] }
            }
          },
          ThoiGianPhucVu: {
            $let: {
              vars: { filtered: { $filter: { input: '$ThoiGianList', as: 'it', cond: { $and: [{ $ne: ['$$it', null] }, { $ne: ['$$it', ''] }] } } } },
              in: { $cond: [{ $gt: [{ $size: '$$filtered' }, 0] }, { $arrayElemAt: ['$$filtered', 0] }, null] }
            }
          }
        }
      },
      { $sort: { TenDichVu: 1 } },
    ]).allowDiskUse(true);

    return res.status(200).json(aggregated);
  } catch (error) {
    console.error('Lỗi getAllServices:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Tao dich vu moi
// @route   POST /api/v1/services
// @access  Private (Admin)
export const createService = async (req, res, next) => {
  try {
    const {
      MaDichVu,
      TenDichVu,
      GiaDichVu,
      DonViTinh,
      TrangThai,
      MoTaDichVu,
      HinhAnhDichVu,
      ThoiGianPhucVu,
    } = req.body;
    if (!MaDichVu || !TenDichVu) {
      return res.status(400).json({ success: false, message: 'MaDichVu và TenDichVu là bắt buộc' });
    }

    const embedded = {
      MaDichVu,
      TenDichVu,
      GiaDichVu: GiaDichVu || 0,
      DonViTinh: DonViTinh || '',
      HinhAnhDichVu: HinhAnhDichVu || '',
      MoTaDichVu: MoTaDichVu || '',
      ThoiGianPhucVu: ThoiGianPhucVu || '',
      TrangThai: TrangThai || 'Đang hoạt động'
    };

    const updateRes = await Room.updateMany(
      { 'DichVu.MaDichVu': { $ne: MaDichVu } },
      { $push: { DichVu: embedded } }
    );

    const modified = (updateRes && (updateRes.modifiedCount ?? updateRes.nModified ?? 0)) || 0;
    const sample = await Room.findOne({ 'DichVu.MaDichVu': MaDichVu }, { 'DichVu.$': 1 }).lean();
    const returned = sample && sample.DichVu && sample.DichVu.length ? sample.DichVu[0] : embedded;
    return res.status(201).json({ success: true, data: returned, modifiedCount: modified });
  } catch (error) {
    console.error('Lỗi createService:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Cập nhật dịch vụ
// @route   PUT /api/v1/services/:id
// @access  Private (Admin)
export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isObjId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjId ? { 'DichVu._id': id } : { 'DichVu.MaDichVu': id };

    const allowed = ['TenDichVu', 'GiaDichVu', 'DonViTinh', 'MoTaDichVu', 'HinhAnhDichVu', 'MaDichVu', 'TrangThai', 'ThoiGianPhucVu'];
    const setFields = {};
    allowed.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        setFields[`DichVu.$[elem].${key}`] = req.body[key];
      }
    });

    if (Object.keys(setFields).length === 0) {
      return res.status(400).json({ success: false, message: 'Không có trường hợp hợp lệ để cập nhật' });
    }

    const arrayFilter = isObjId ? [{ 'elem._id': new mongoose.Types.ObjectId(id) }] : [{ 'elem.MaDichVu': id }];

    const updateRes = await Room.updateMany(filter, { $set: setFields }, { arrayFilters: arrayFilter });
    const modified = (updateRes && (updateRes.modifiedCount ?? updateRes.nModified ?? 0)) || 0;

    let sampleUpdated = null;
    if (isObjId) {
      sampleUpdated = await Room.findOne({ 'DichVu._id': id }, { 'DichVu.$': 1 }).lean();
    } else {
      sampleUpdated = await Room.findOne({ 'DichVu.MaDichVu': id }, { 'DichVu.$': 1 }).lean();
    }

    const updatedEmbedded = sampleUpdated && sampleUpdated.DichVu && sampleUpdated.DichVu.length ? sampleUpdated.DichVu[0] : null;

    if (!updatedEmbedded) {
      const synthetic = {
        MaDichVu: req.body.MaDichVu || (!isObjId ? id : req.body.MaDichVu || ''),
        TenDichVu: req.body.TenDichVu || '',
        GiaDichVu: req.body.GiaDichVu ?? 0,
        DonViTinh: req.body.DonViTinh || '',
        MoTaDichVu: req.body.MoTaDichVu || '',
        HinhAnhDichVu: req.body.HinhAnhDichVu || '',
        ThoiGianPhucVu: req.body.ThoiGianPhucVu || '',
        TrangThai: req.body.TrangThai || ''
      };
      return res.status(200).json({ success: true, data: synthetic, modifiedCount: modified });
    }

    return res.status(200).json({ success: true, data: updatedEmbedded, modifiedCount: modified });
  } catch (error) {
    console.error('Lỗi updateService:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Get a single service (embedded) by id or MaDichVu
// @route   GET /api/v1/services/:id
// @access  Public
export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const svc = await findServiceByParam(id);
    if (!svc) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
    return res.status(200).json({ success: true, data: svc });
  } catch (error) {
    console.error('Lỗi getServiceById:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Xóa dịch vụ
// @route   DELETE /api/v1/services/:id
// @access  Private (Admin)
export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) {
      const roomHit = await Room.findOne({ 'DichVu._id': id }, { 'DichVu.$': 1 }).lean();
      if (!roomHit || !roomHit.DichVu || !roomHit.DichVu.length) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
      }
      const code = roomHit.DichVu[0].MaDichVu;
      try {
        const resUpdate = await Room.updateMany({ 'DichVu.MaDichVu': code }, { $pull: { DichVu: { MaDichVu: code } } });
        const modified = (resUpdate && (resUpdate.modifiedCount ?? resUpdate.nModified ?? 0)) || 0;
        return res.status(200).json({ success: true, message: 'Đã xóa dịch vụ (theo mã)', modifiedCount: modified });
      } catch (pullErr) {
        console.warn('Xóa dịch vụ khỏi các phòng thất bại:', pullErr);
        return res.status(500).json({ success: false, message: 'Xóa thất bại', error: String(pullErr) });
      }
    }

    try {
      const resUpdate = await Room.updateMany({ 'DichVu.MaDichVu': id }, { $pull: { DichVu: { MaDichVu: id } } });
      const modified = (resUpdate && (resUpdate.modifiedCount ?? resUpdate.nModified ?? 0)) || 0;
      return res.status(200).json({ success: true, message: 'Đã xóa dịch vụ (theo mã)', modifiedCount: modified });
    } catch (pullErr) {
      console.warn('Xóa dịch vụ khỏi các phòng thất bại:', pullErr);
      return res.status(500).json({ success: false, message: 'Xóa thất bại', error: String(pullErr) });
    }
  } catch (error) {
    console.error('Lỗi deleteService:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Upload/overwrite image for a service
// @route   PUT /api/v1/services/:id/image
// @access  Private (Admin)
export const uploadServiceImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ success: false, message: 'Không có file' });

    let service = await findServiceByParam(id);
    const usingCode = service ? service.MaDichVu : id;

    const imagesDir = path.resolve('backend', 'src', 'assets', 'images', 'services');
    await fs.mkdir(imagesDir, { recursive: true });

    const ext = path.extname(req.file.originalname) || '';
    const prevFilename = service ? (service.HinhAnhDichVu || '') : '';
    const filenameToUse = prevFilename && prevFilename.trim() ? prevFilename : `${usingCode}${ext}`;
    const target = path.join(imagesDir, filenameToUse);

    await fs.writeFile(target, req.file.buffer);

    let modifiedCount = 0;
    try {
      const resUpdate = await Room.updateMany(
        { 'DichVu.MaDichVu': usingCode },
        { $set: { 'DichVu.$[elem].HinhAnhDichVu': filenameToUse } },
        { arrayFilters: [{ 'elem.MaDichVu': usingCode }] }
      );
      modifiedCount = (resUpdate && (resUpdate.modifiedCount ?? resUpdate.nModified ?? 0)) || 0;
    } catch (e) {
      console.warn('uploadServiceImage: could not update embedded rooms', e);
    }

    return res.status(200).json({ success: true, data: { HinhAnhDichVu: filenameToUse }, modifiedCount });
  } catch (error) {
    console.error('Lỗi uploadServiceImage:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// @desc    Get usage statistics for a service
// @route   GET /api/v1/services/:id/stats
// @access  Private (Admin)
export const getServiceStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const svc = await findServiceByParam(id);
    let code;
    if (svc) {
      code = svc.MaDichVu;
    } else {
      code = id;
    }

    const agg = await Booking.aggregate([
      { $match: { 'DichVuSuDung.MaDichVu': code } },
      { $unwind: '$DichVuSuDung' },
      { $match: { 'DichVuSuDung.MaDichVu': code } },
      {
        $group: {
          _id: null,
          bookings: { $addToSet: '$MaDatPhong' },
          totalQuantity: { $sum: '$DichVuSuDung.SoLuong' },
          totalRevenue: { $sum: '$DichVuSuDung.ThanhTien' },
        }
      }
    ]).allowDiskUse(true);

    const row = agg[0] || { bookings: [], totalQuantity: 0, totalRevenue: 0 };

    // Simple per-period breakdown omitted for brevity, return basic stats
    const stats = { bookingsCount: row.bookings.length, totalQuantity: row.totalQuantity, totalRevenue: row.totalRevenue };
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Lỗi getServiceStats:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};
