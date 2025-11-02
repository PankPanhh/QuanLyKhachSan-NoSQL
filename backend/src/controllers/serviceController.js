import Room from '../models/Room.js';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Booking from '../models/Booking.js';
import sharp from 'sharp';

// Helper: derive next sequence for service codes by scanning existing DV codes
// NOTE: This implementation avoids creating a separate `counters` collection.
// It inspects embedded `DichVu.MaDichVu` values across rooms, extracts the
// numeric suffix for codes like `DV001` and returns max+1. This is simpler but
// not strictly atomic under heavy concurrent inserts — acceptable if the app
// traffic is moderate. If you later want strict atomicity, we can revisit an
// atomic counter approach using a dedicated document.
const getNextServiceSeq = async () => {
  try {
    // Fetch distinct codes to keep implementation compatible across Mongo versions
    const codes = await Room.distinct('DichVu.MaDichVu', { 'DichVu.MaDichVu': { $exists: true } });
    let max = 0;
    if (Array.isArray(codes)) {
      for (const c of codes) {
        if (typeof c !== 'string') continue;
        const m = c.match(/^DV(\d+)$/i);
        if (m && m[1]) {
          const n = parseInt(m[1], 10);
          if (!Number.isNaN(n) && n > max) max = n;
        }
      }
    }
    return max + 1;
  } catch (err) {
    console.warn('getNextServiceSeq failed, defaulting to 1', err);
    return 1;
  }
};

const sanitizeName = (s) => {
  if (!s) return '';
  return String(s).trim().toLowerCase().replace(/[^a-z0-9\s_-]/g, '').replace(/\s+/g, '_').replace(/_+/g, '_');
};

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
      TenDichVu,
      GiaDichVu,
      DonViTinh,
      TrangThai,
      MoTaDichVu,
      HinhAnhDichVu,
      ThoiGianPhucVu,
    } = req.body;
    if (!TenDichVu) {
      return res.status(400).json({ success: false, message: 'TenDichVu là bắt buộc' });
    }

    // Ignore any client-supplied MaDichVu: server always generates it
    if (Object.prototype.hasOwnProperty.call(req.body, 'MaDichVu')) {
      // Do not allow client to set MaDichVu; silently ignore but log for debugging
      console.warn('Client attempted to set MaDichVu on create — ignored');
      try { delete req.body.MaDichVu; } catch (e) { /* ignore */ }
    }

    // Generate a unique MaDichVu in format DVxxx using derived sequence
    let seq = await getNextServiceSeq();
    // format with at least 3 digits
    const MaDichVu = `DV${String(seq).padStart(3, '0')}`;

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

  // Do not allow changing MaDichVu via update (it's immutable)
  const allowed = ['TenDichVu', 'GiaDichVu', 'DonViTinh', 'MoTaDichVu', 'HinhAnhDichVu', 'TrangThai', 'ThoiGianPhucVu'];
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
    // Resolve images directory relative to this file to avoid CWD-dependent paths
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Read optional flags from the multipart form fields
    const preserveNameFlag = req.body && (req.body.preserveName === '1' || req.body.preserveName === 'true' || req.body.preserveName === 'yes');
    const requestedExisting = req.body && req.body.existingFilename ? String(req.body.existingFilename) : '';

    // Determine where to save the file. Default: services folder.
    // If the client provided an existingFilename that contains a path or URL
    // pointing to another assets subfolder (e.g. /assets/images/room), save there instead.
    let imagesDir = path.join(__dirname, '..', 'assets', 'images', 'services');
    if (requestedExisting && requestedExisting.trim()) {
      try {
        let p = String(requestedExisting).trim();
        // If it's a full URL, extract the pathname
        if (/^https?:\/\//i.test(p)) {
          try { p = new URL(p).pathname; } catch (e) { /* ignore */ }
        }
        // Normalize to use forward slashes for detection
        const lp = p.replace(/\\/g, '/');
        if (lp.includes('/assets/images/room')) {
          imagesDir = path.join(__dirname, '..', 'assets', 'images', 'room');
        } else if (lp.includes('/assets/images/services')) {
          imagesDir = path.join(__dirname, '..', 'assets', 'images', 'services');
        } else {
          // Try to capture other subfolders under /assets/images/<sub>
          const m = lp.match(/\/assets\/images\/([^\/]+)/);
          if (m && m[1]) {
            imagesDir = path.join(__dirname, '..', 'assets', 'images', m[1]);
          }
        }
      } catch (e) {
        // ignore and use default
      }
    }
    await fs.mkdir(imagesDir, { recursive: true });

    const ext = path.extname(req.file.originalname) || '';
    const prevFilename = service ? (service.HinhAnhDichVu || '') : '';

  // If the client requests to preserve the existing filename, prefer that (but sanitize)

    // Use the service's name as the image filename (sanitized). Fallback to code.
    const nameSan = sanitizeName(service?.TenDichVu || usingCode) || String(usingCode).replace(/[^a-zA-Z0-9_-]/g, '_');
    let baseName = nameSan;
  const filenameToUse = `${baseName}${ext}`;
  const target = path.join(imagesDir, filenameToUse);
  // no thumbnail generation - save only the main image

    // Use sharp to write optimized main image and a thumbnail
    try {
      // Write large/optimized main image (preserve aspect ratio, max width 1200)
      await sharp(req.file.buffer).resize({ width: 1200, withoutEnlargement: true }).toFile(target);
  // (thumbnail generation intentionally disabled)
    } catch (sharpErr) {
      // Fallback: write raw buffer if sharp fails
      await fs.writeFile(target, req.file.buffer);
      console.warn('sharp processing failed, wrote raw file instead:', sharpErr);
    }

    // If previous filename existed and is different from the new one, try to remove the old files
    try {
      if (prevFilename && prevFilename.trim() && prevFilename !== filenameToUse) {
        const prevNameOnly = path.basename(prevFilename);
        const prevTarget = path.join(imagesDir, prevNameOnly);
        // unlink if exists (ignore errors)
        try { await fs.unlink(prevTarget); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      // ignore cleanup errors
    }

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
