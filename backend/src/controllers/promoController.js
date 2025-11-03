import Room from '../models/Room.js';
import mongoose from 'mongoose';

// GET /api/v1/promotions
// Query params:
//   status=all|active|expired  (default: active)
export const getAllPromotions = async (req, res, next) => {
  try {
    const { status = 'active' } = req.query;
    const now = new Date();

    // Aggregate embedded KhuyenMai entries and attach parent room info
    const pipeline = [
      // Only rooms that have KhuyenMai array
      { $match: { KhuyenMai: { $exists: true, $ne: [] } } },
      { $unwind: '$KhuyenMai' },
      {
        $project: {
          roomId: '$_id',
          MaPhong: '$MaPhong',
          TenPhong: '$TenPhong',
          LoaiPhong: '$LoaiPhong',
          // HinhAnh may be stored as array or single string in some documents. Handle both.
          HinhAnh: {
            $cond: {
              if: { $eq: [{ $type: '$HinhAnh' }, 'array'] },
              then: { $arrayElemAt: ['$HinhAnh', 0] },
              else: '$HinhAnh',
            },
          },
          // include price (support multiple possible field names) so frontend can compute discounted prices
          GiaPhong: {
            $ifNull: [
              '$GiaPhong',
              { $ifNull: ['$giaPhong', { $ifNull: ['$Gia', '$price'] }] },
            ],
          },
          KhuyenMai: '$KhuyenMai',
        },
      },
      // Normalize dates so we can filter
      {
        $addFields: {
          'KhuyenMai.NgayBatDau': { $toDate: '$KhuyenMai.NgayBatDau' },
          'KhuyenMai.NgayKetThuc': { $toDate: '$KhuyenMai.NgayKetThuc' },
        },
      },
    ];

    // Apply status filtering in pipeline to reduce transferred data
    if (status === 'active') {
      pipeline.push({
        $match: {
          'KhuyenMai.TrangThai': 'Hoạt động',
          $expr: {
            $and: [
              { $lte: ['$KhuyenMai.NgayBatDau', now] },
              { $gte: ['$KhuyenMai.NgayKetThuc', now] },
            ],
          },
        },
      });
    } else if (status === 'expired') {
      pipeline.push({ $match: { $expr: { $lt: ['$KhuyenMai.NgayKetThuc', now] } } });
    }

    // Group back by promo identity.
    // Prefer MaKhuyenMai as the unique key; if it's missing, fall back to a normalized TenChuongTrinh.
    // This avoids duplicate promotion entries when the same promo is embedded in many rooms.
    pipeline.push({
      $group: {
        _id: {
          key: {
            $ifNull: [
              '$KhuyenMai.MaKhuyenMai',
              { $toUpper: { $ifNull: ['$KhuyenMai.TenChuongTrinh', '$KhuyenMai.TenKM'] } }
            ],
          },
          title: '$KhuyenMai.TenChuongTrinh',
        },
        promoFirst: { $first: '$KhuyenMai' },
        promoStart: { $min: '$KhuyenMai.NgayBatDau' },
        promoEnd: { $max: '$KhuyenMai.NgayKetThuc' },
        activeCount: { $sum: { $cond: [{ $eq: ['$KhuyenMai.TrangThai', 'Hoạt động'] }, 1, 0] } },
        rooms: {
          $push: {
            roomId: '$roomId',
            MaPhong: '$MaPhong',
            TenPhong: '$TenPhong',
            LoaiPhong: '$LoaiPhong',
            HinhAnh: '$HinhAnh',
            GiaPhong: '$GiaPhong',
          },
        },
      },
    });

    const results = await Room.aggregate(pipeline).exec();

    // Map to a more stable JSON shape
    const promos = results.map((r) => {
      const promoObj = r.promoFirst || r.promo || {};
      // normalize start/end and status
      if (r.promoStart) promoObj.NgayBatDau = r.promoStart;
      if (r.promoEnd) promoObj.NgayKetThuc = r.promoEnd;
      if (r.activeCount && r.activeCount > 0) promoObj.TrangThai = 'Hoạt động';
      // normalize legacy/modern field names
      promoObj.LoaiGiamGia = promoObj.LoaiGiamGia || promoObj.LoaiKhuyenMai || null;
      // prefer GiaTriGiam, fallback to legacy GiaTri
      promoObj.GiaTriGiam = promoObj.GiaTriGiam != null ? Number(promoObj.GiaTriGiam) : (promoObj.GiaTri != null ? Number(promoObj.GiaTri) : undefined);
      // derive stable id from the grouping key
      const stableId = r._id && r._id.key ? r._id.key : (promoObj.MaKhuyenMai || promoObj.TenChuongTrinh || promoObj.TenKM || null);
      return {
        id: stableId,
        title: r._id && r._id.title ? r._id.title : (promoObj && (promoObj.TenChuongTrinh || promoObj.TenKM)) || null,
        promo: promoObj,
        rooms: r.rooms,
      };
    });

    return res.status(200).json({ success: true, data: promos });
  } catch (error) {
    console.error('Error getAllPromotions:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// GET /api/v1/promotions/:id
// Returns a single promotion (identified by MaKhuyenMai or TenChuongTrinh) with list of rooms
export const getPromotionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const now = new Date();
    // roomStatus controls whether we return only rooms whose promo instance is active/expired/all
    // default: 'active' to match list behavior
    const roomStatus = (req.query.roomStatus || 'active').toLowerCase();

    const pipeline = [
      { $match: { KhuyenMai: { $exists: true, $ne: [] } } },
      { $unwind: '$KhuyenMai' },
      {
        $project: {
          roomId: '$_id',
          MaPhong: '$MaPhong',
          TenPhong: '$TenPhong',
          LoaiPhong: '$LoaiPhong',
          HinhAnh: {
            $cond: {
              if: { $eq: [{ $type: '$HinhAnh' }, 'array'] },
              then: { $arrayElemAt: ['$HinhAnh', 0] },
              else: '$HinhAnh',
            },
          },
          GiaPhong: {
            $ifNull: [
              '$GiaPhong',
              { $ifNull: ['$giaPhong', { $ifNull: ['$Gia', '$price'] }] },
            ],
          },
          KhuyenMai: '$KhuyenMai',
        },
      },
      // convert promo dates
      {
        $addFields: {
          'KhuyenMai.NgayBatDau': { $toDate: '$KhuyenMai.NgayBatDau' },
          'KhuyenMai.NgayKetThuc': { $toDate: '$KhuyenMai.NgayKetThuc' },
        },
      },
      // match by MaKhuyenMai or TenChuongTrinh (case-insensitive)
      {
        $match: {
          $or: [
            { 'KhuyenMai.MaKhuyenMai': id },
            { 'KhuyenMai.TenChuongTrinh': { $regex: new RegExp(`^${id}$`, 'i') } },
          ],
        },
      },
      {
        $group: {
          _id: {
            key: {
              $ifNull: [
                '$KhuyenMai.MaKhuyenMai',
                { $toUpper: { $ifNull: ['$KhuyenMai.TenChuongTrinh', '$KhuyenMai.TenKM'] } }
              ],
            },
            title: '$KhuyenMai.TenChuongTrinh',
          },
          promoFirst: { $first: '$KhuyenMai' },
          promoStart: { $min: '$KhuyenMai.NgayBatDau' },
          promoEnd: { $max: '$KhuyenMai.NgayKetThuc' },
          activeCount: { $sum: { $cond: [{ $eq: ['$KhuyenMai.TrangThai', 'Hoạt động'] }, 1, 0] } },
          rooms: {
            $push: {
              roomId: '$roomId',
              MaPhong: '$MaPhong',
              TenPhong: '$TenPhong',
              LoaiPhong: '$LoaiPhong',
              HinhAnh: '$HinhAnh',
              GiaPhong: '$GiaPhong',
              // include the promo instance fields so we can filter per-room
              promoInstanceStart: '$KhuyenMai.NgayBatDau',
              promoInstanceEnd: '$KhuyenMai.NgayKetThuc',
              promoInstanceStatus: '$KhuyenMai.TrangThai',
              promoInstanceId: '$KhuyenMai.MaKhuyenMai',
            },
          },
        },
      },
    ];

    const results = await Room.aggregate(pipeline).exec();

    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
    }

    const r = results[0];
    const promoObj = r.promoFirst || r.promo || {};
    // normalize start/end and status across rooms
    if (r.promoStart) promoObj.NgayBatDau = r.promoStart;
    if (r.promoEnd) promoObj.NgayKetThuc = r.promoEnd;
    if (r.activeCount && r.activeCount > 0) promoObj.TrangThai = 'Hoạt động';
  // normalize legacy/modern field names
  promoObj.LoaiGiamGia = promoObj.LoaiGiamGia || promoObj.LoaiKhuyenMai || null;
  promoObj.GiaTriGiam = promoObj.GiaTriGiam != null ? Number(promoObj.GiaTriGiam) : (promoObj.GiaTri != null ? Number(promoObj.GiaTri) : undefined);

    // determine primary image from first room if promo has none
    const primaryImage = (r.rooms && r.rooms.length && r.rooms[0].HinhAnh) || promoObj.HinhAnh || null;

    // compute status flags for overall promo
    const start = promoObj.NgayBatDau ? new Date(promoObj.NgayBatDau) : null;
    const end = promoObj.NgayKetThuc ? new Date(promoObj.NgayKetThuc) : null;
    const nowDate = new Date();
    const isActive =
      promoObj.TrangThai === 'Hoạt động' && (!start || start <= nowDate) && (!end || end >= nowDate);

    // Filter rooms by their own promo instance validity according to roomStatus
    const roomsAll = (r.rooms || []).map((room) => {
      return {
        ...room,
        promoInstanceStart: room.promoInstanceStart ? new Date(room.promoInstanceStart) : null,
        promoInstanceEnd: room.promoInstanceEnd ? new Date(room.promoInstanceEnd) : null,
        promoInstanceStatus: room.promoInstanceStatus || null,
      };
    });

    let roomsFiltered = roomsAll;
    if (roomStatus === 'active') {
      roomsFiltered = roomsAll.filter((rm) => {
        const s = rm.promoInstanceStart;
        const e = rm.promoInstanceEnd;
        return rm.promoInstanceStatus === 'Hoạt động' && (!s || s <= nowDate) && (!e || e >= nowDate);
      });
    } else if (roomStatus === 'expired') {
      roomsFiltered = roomsAll.filter((rm) => {
        const e = rm.promoInstanceEnd;
        return e && e < nowDate;
      });
    } // 'all' leaves roomsFiltered as-is

    // collect distinct room types
    const roomTypes = Array.from(new Set((r.rooms || []).map((x) => x.LoaiPhong).filter(Boolean)));

    const response = {
      id: (r._id && r._id.key) || (promoObj.MaKhuyenMai || promoObj.TenChuongTrinh || promoObj.TenKM) || null,
      title: r._id && r._id.title ? r._id.title : (promoObj.TenChuongTrinh || promoObj.TenKM) || null,
      promo: promoObj,
      rooms: roomsFiltered || [],
      primaryImage,
      isActive,
      roomTypes,
    };

    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('Error getPromotionById:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// POST /api/v1/promotions
// Body: MaKhuyenMai, TenChuongTrinh, LoaiGiamGia, GiaTriGiam, NgayBatDau, NgayKetThuc, LoaiPhongApDung (array), DieuKien, MoTa, TrangThai
export const createPromotion = async (req, res, next) => {
  try {
    const {
      MaKhuyenMai,
      TenChuongTrinh,
      LoaiGiamGia,
      GiaTriGiam,
      NgayBatDau,
      NgayKetThuc,
      LoaiPhongApDung = [],
        RoomIds = [],
        DieuKien,
      MoTa,
      TrangThai = 'Hoạt động',
    } = req.body;

    // Basic validation
    if (!TenChuongTrinh) return res.status(400).json({ success: false, message: 'Tên chương trình là bắt buộc' });
    if (GiaTriGiam == null || isNaN(GiaTriGiam) || Number(GiaTriGiam) <= 0) return res.status(400).json({ success: false, message: 'Giá trị giảm phải > 0' });
    const start = NgayBatDau ? new Date(NgayBatDau) : null;
    const end = NgayKetThuc ? new Date(NgayKetThuc) : null;
    if (start && end && start > end) return res.status(400).json({ success: false, message: 'NgayBatDau phải nhỏ hơn hoặc bằng NgayKetThuc' });

    // Check for duplicate MaKhuyenMai across rooms
    if (MaKhuyenMai) {
      const exists = await Room.findOne({ 'KhuyenMai.MaKhuyenMai': MaKhuyenMai }).lean().exec();
      if (exists) return res.status(409).json({ success: false, message: 'MaKhuyenMai đã tồn tại' });
    }

    // Prepare promo object to push into rooms
    const promoToAdd = {
      MaKhuyenMai,
      TenChuongTrinh,
      LoaiGiamGia,
      // also include legacy field name used in Room.KhuyenMai schema
      LoaiKhuyenMai: LoaiGiamGia,
      GiaTriGiam: Number(GiaTriGiam),
      // also include legacy numeric field
      GiaTri: Number(GiaTriGiam),
      NgayBatDau: start,
      NgayKetThuc: end,
      DieuKien,
      MoTa,
      TrangThai,
    };


    // Determine target rooms: prefer explicit RoomIds, then LoaiPhongApDung, then 'ALL'
    let filter = {};
    const hasRoomIds = Array.isArray(RoomIds) && RoomIds.length > 0;
    const hasLoaiPhong = Array.isArray(LoaiPhongApDung) && LoaiPhongApDung.length > 0;

    if (!hasRoomIds && !hasLoaiPhong) {
      return res.status(400).json({ success: false, message: 'Chọn ít nhất 1 loại phòng/ap dụng cho tất cả phòng hoặc chọn phòng cụ thể' });
    }

    // If RoomIds provided, build filter matching _id or MaPhong values
    if (hasRoomIds) {
      const ids = Array.from(new Set(RoomIds.map(String)));
  const objectIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
      const nonObjectIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
      const orClauses = [];
      if (objectIds.length) orClauses.push({ _id: { $in: objectIds } });
      if (nonObjectIds.length) orClauses.push({ MaPhong: { $in: nonObjectIds } });
      if (orClauses.length === 1) filter = orClauses[0];
      else filter = { $or: orClauses };
    } else {
      // Support special marker 'ALL' to mean apply to all rooms in the hotel
      if (LoaiPhongApDung.includes('ALL')) {
        filter = {}; // no filter -> all rooms
      } else {
        filter = { LoaiPhong: { $in: LoaiPhongApDung } };
      }
    }

    // Update matching rooms: replace KhuyenMai array with single promo (enforce one-promo-per-room)
    const result = await Room.updateMany(
      filter,
      { $set: { KhuyenMai: [promoToAdd] } }
    ).exec();

    return res.status(201).json({ success: true, message: 'Tạo chương trình khuyến mãi thành công', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error createPromotion:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// PUT /api/v1/promotions/:id
// Update promotion fields (TenChuongTrinh, LoaiGiamGia, GiaTriGiam, NgayBatDau, NgayKetThuc, DieuKien, MoTa, TrangThai)
export const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('🔧 DEBUG updatePromotion - ID:', id);
    console.log('🔧 DEBUG updatePromotion - Request body:', JSON.stringify(req.body, null, 2));
    
    // Input validation
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID khuyến mãi là bắt buộc' });
    }
    
    const {
      TenChuongTrinh,
      LoaiGiamGia,
      GiaTriGiam,
      NgayBatDau,
      NgayKetThuc,
      DieuKien,
      MoTa,
      TrangThai,
    } = req.body;

    // Simple validation
    if (GiaTriGiam != null && (isNaN(GiaTriGiam) || Number(GiaTriGiam) <= 0)) {
      return res.status(400).json({ success: false, message: 'Giá trị giảm phải > 0' });
    }
    
    let start = null, end = null;
    if (NgayBatDau) {
      start = new Date(NgayBatDau);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ success: false, message: 'NgayBatDau không hợp lệ' });
      }
    }
    if (NgayKetThuc) {
      end = new Date(NgayKetThuc);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ success: false, message: 'NgayKetThuc không hợp lệ' });
      }
    }
    if (start && end && start > end) {
      return res.status(400).json({ success: false, message: 'NgayBatDau phải nhỏ hơn hoặc bằng NgayKetThuc' });
    }

    // Build update operations
    const setOps = {};
    if (TenChuongTrinh !== undefined) setOps['KhuyenMai.$[elem].TenChuongTrinh'] = TenChuongTrinh;
    if (LoaiGiamGia !== undefined) {
      setOps['KhuyenMai.$[elem].LoaiGiamGia'] = LoaiGiamGia;
      setOps['KhuyenMai.$[elem].LoaiKhuyenMai'] = LoaiGiamGia; // legacy field
    }
    if (GiaTriGiam !== undefined) {
      setOps['KhuyenMai.$[elem].GiaTriGiam'] = Number(GiaTriGiam);
      setOps['KhuyenMai.$[elem].GiaTri'] = Number(GiaTriGiam); // legacy field
    }
    if (NgayBatDau !== undefined) setOps['KhuyenMai.$[elem].NgayBatDau'] = start;
    if (NgayKetThuc !== undefined) setOps['KhuyenMai.$[elem].NgayKetThuc'] = end;
    if (DieuKien !== undefined) setOps['KhuyenMai.$[elem].DieuKien'] = DieuKien;
    if (MoTa !== undefined) setOps['KhuyenMai.$[elem].MoTa'] = MoTa;
    if (TrangThai !== undefined) setOps['KhuyenMai.$[elem].TrangThai'] = TrangThai;

    if (Object.keys(setOps).length === 0) {
      return res.status(400).json({ success: false, message: 'Không có trường nào để cập nhật' });
    }

    console.log('🔧 Starting update operations with setOps:', setOps);

    // Try simple update by MaKhuyenMai first
    const updateById = await Room.updateMany(
      { 'KhuyenMai.MaKhuyenMai': id },
      { $set: setOps },
      { arrayFilters: [{ 'elem.MaKhuyenMai': id }] }
    ).exec();
    
    console.log('🔧 Update by ID result:', updateById);

    // Then try by TenChuongTrinh if needed
    const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapeRegex(id)}$`, 'i');
    
    const updateByTitle = await Room.updateMany(
      { 'KhuyenMai.TenChuongTrinh': { $regex: regex } },
      { $set: setOps },
      { arrayFilters: [{ 'elem.TenChuongTrinh': { $regex: regex } }] }
    ).exec();
    
    console.log('🔧 Update by title result:', updateByTitle);

    const modified = (updateById.modifiedCount || 0) + (updateByTitle.modifiedCount || 0);

    console.log('🔧 Final response - success: true, modifiedCount:', modified);
    return res.status(200).json({ 
      success: true, 
      message: 'Cập nhật khuyến mãi thành công', 
      modifiedCount: modified,
      debug: {
        updateById: updateById.modifiedCount || 0,
        updateByTitle: updateByTitle.modifiedCount || 0
      }
    });

  } catch (error) {
    console.error('🔧 ERROR in updatePromotion:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi server', 
      error: error.message,
      errorName: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export default { getAllPromotions, getPromotionById, createPromotion, updatePromotion };
