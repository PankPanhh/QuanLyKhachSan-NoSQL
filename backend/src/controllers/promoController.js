import Room from '../models/Room.js';
import mongoose from 'mongoose';

// GET /api/v1/promotions
// Query params:
//   status=all|active|expired  (default: active)
export const getAllPromotions = async (req, res, next) => {
  try {
    // Update promo statuses in DB based on dates
    const now = new Date();
    const rooms = await Room.find({ KhuyenMai: { $exists: true, $ne: [] } });
    for (const room of rooms) {
      for (const km of room.KhuyenMai) {
        const start = km.NgayBatDau ? new Date(km.NgayBatDau) : null;
        const end = km.NgayKetThuc ? new Date(km.NgayKetThuc) : null;
        let newStatus = 'Hoạt động';
        if (end && end < now) newStatus = 'Hết hạn';
        else if (start && start > now) newStatus = 'Sắp diễn ra';
        if (km.TrangThai !== newStatus) {
          await Room.updateOne(
            { _id: room._id, 'KhuyenMai._id': km._id },
            { $set: { 'KhuyenMai.$.TrangThai': newStatus } }
          );
        }
      }
    }

    const { status = 'active' } = req.query;

    // Aggregate embedded KhuyenMai entries and attach parent room info
    const pipeline = [
      // Only rooms that have KhuyenMai array
      { $match: { KhuyenMai: { $exists: true, $ne: [] } } },
  { $unwind: '$KhuyenMai' },
  // Only include rooms that are currently available to customers
  { $match: { TinhTrang: 'Trống' } },
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
    // default: 'all' to match list behavior
    const roomStatus = (req.query.roomStatus || 'all').toLowerCase();

    const pipeline = [
      { $match: { KhuyenMai: { $exists: true, $ne: [] } } },
  { $unwind: '$KhuyenMai' },
  // Only include rooms that are currently available to customers
  { $match: { TinhTrang: 'Trống' } },
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

    console.log('getPromotionById for id:', id, 'results length:', results.length, 'rooms length:', r.rooms ? r.rooms.length : 0, 'response rooms:', response.rooms.length);

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

    // Update matching rooms: but only those that don't already have promotions
    // Combine the filter with condition for rooms without existing promotions
    const finalFilter = {
      ...filter,
      $or: [
        { KhuyenMai: { $exists: false } },
        { KhuyenMai: { $size: 0 } },
        { KhuyenMai: null }
      ]
    };

    console.log('📝 createPromotion - Final filter (only rooms without promotions):', JSON.stringify(finalFilter, null, 2));

    const result = await Room.updateMany(
      finalFilter,
      { $set: { KhuyenMai: [promoToAdd] } }
    ).exec();

    // Count how many rooms were skipped because they already have promotions
    const totalMatchingRooms = await Room.countDocuments(filter).exec();
    const skippedRooms = totalMatchingRooms - result.modifiedCount;

    console.log('📝 createPromotion - Total matching rooms:', totalMatchingRooms);
    console.log('📝 createPromotion - Rooms with existing promotions (skipped):', skippedRooms);
    console.log('📝 createPromotion - Rooms updated:', result.modifiedCount);

    return res.status(201).json({ 
      success: true, 
      message: `Tạo chương trình khuyến mãi thành công. Đã áp dụng cho ${result.modifiedCount} phòng${skippedRooms > 0 ? ` (${skippedRooms} phòng đã có khuyến mãi khác)` : ''}`, 
      modifiedCount: result.modifiedCount,
      skippedCount: skippedRooms
    });
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
      rooms, // Array of room IDs (MaPhong) to apply this promotion to
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

    // Build promotion object for room assignment
    const promotionData = {
      MaKhuyenMai: id,
      TenChuongTrinh,
      LoaiGiamGia,
      GiaTriGiam: GiaTriGiam ? Number(GiaTriGiam) : 0, // Default to 0 instead of undefined
      NgayBatDau: start,
      NgayKetThuc: end,
      DieuKien,
      MoTa,
      TrangThai,
    };

    // Don't remove undefined fields - keep all fields for consistency
    // Object.keys(promotionData).forEach(key => {
    //   if (promotionData[key] === undefined) {
    //     delete promotionData[key];
    //   }
    // });

    console.log('🔧 Promotion data to assign:', promotionData);
    console.log('🔧 Rooms to apply to:', rooms);

    // Get current rooms that have this promotion
    const currentRoomsWithPromo = await Room.find({
      'KhuyenMai.MaKhuyenMai': id
    }).select('MaPhong _id').exec();

    console.log('🔧 Current rooms with this promo:', currentRoomsWithPromo.map(r => r.MaPhong));

    // If no rooms specified in request, keep current room assignment
    const targetRoomIds = rooms && rooms.length > 0 ? rooms : currentRoomsWithPromo.map(r => r.MaPhong);

    console.log('🔧 Target rooms (using current if none specified):', targetRoomIds);

    // Determine rooms to remove promotion from
    const currentRoomIds = currentRoomsWithPromo.map(r => r.MaPhong);
    const roomsToRemove = currentRoomIds.filter(roomId => !targetRoomIds.includes(roomId));
    const roomsToAdd = targetRoomIds.filter(roomId => !currentRoomIds.includes(roomId));
    const roomsToUpdate = targetRoomIds.filter(roomId => currentRoomIds.includes(roomId));

    console.log('🔧 Rooms to remove promo from:', roomsToRemove);
    console.log('🔧 Rooms to add promo to:', roomsToAdd);
    console.log('🔧 Rooms to update promo in:', roomsToUpdate);

    let totalModified = 0;

    // 1. Remove promotion from rooms that should no longer have it
    if (roomsToRemove.length > 0) {
      console.log(`🔧 Removing promotion from ${roomsToRemove.length} rooms...`);
      try {
        const removeResult = await Room.updateMany(
          { MaPhong: { $in: roomsToRemove } },
          { $pull: { KhuyenMai: { MaKhuyenMai: id } } }
        ).exec();
        console.log('🔧 Remove from rooms result:', removeResult);
        totalModified += removeResult.modifiedCount || 0;
      } catch (removeError) {
        console.error('🔧 Error removing promotion from rooms:', removeError);
        throw removeError;
      }
    }

    // 2. Add promotion to new rooms
    if (roomsToAdd.length > 0) {
      console.log(`🔧 Adding promotion to ${roomsToAdd.length} rooms...`);
      try {
        const addResult = await Room.updateMany(
          { MaPhong: { $in: roomsToAdd } },
          { $push: { KhuyenMai: promotionData } }
        ).exec();
        console.log('🔧 Add to rooms result:', addResult);
        totalModified += addResult.modifiedCount || 0;
      } catch (addError) {
        console.error('🔧 Error adding promotion to rooms:', addError);
        throw addError;
      }
    }

    // 3. Update promotion data in existing rooms
    if (roomsToUpdate.length > 0) {
      console.log(`🔧 Updating promotion in ${roomsToUpdate.length} existing rooms...`);
      try {
        const updateResult = await Room.updateMany(
          { MaPhong: { $in: roomsToUpdate }, 'KhuyenMai.MaKhuyenMai': id },
          { $set: { 'KhuyenMai.$': promotionData } }
        ).exec();
        console.log('🔧 Update in existing rooms result:', updateResult);
        totalModified += updateResult.modifiedCount || 0;
      } catch (updateError) {
        console.error('🔧 Error updating promotion in existing rooms:', updateError);
        throw updateError;
      }
    }

    console.log('🔧 Final response - success: true, totalModified:', totalModified);
    console.log('🔧 Operation summary:');
    console.log('🔧 - Rooms to remove:', roomsToRemove.length);
    console.log('🔧 - Rooms to add:', roomsToAdd.length);
    console.log('🔧 - Rooms to update:', roomsToUpdate.length);
    console.log('🔧 - Total rooms targeted:', targetRoomIds.length);
    console.log('🔧 - Total modified:', totalModified);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Cập nhật khuyến mãi thành công', 
      modifiedCount: totalModified,
      debug: {
        roomsToRemove: roomsToRemove.length,
        roomsToAdd: roomsToAdd.length,
        roomsToUpdate: roomsToUpdate.length,
        totalTargeted: targetRoomIds.length
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

// GET /api/v1/rooms/available-for-promo
// Query params: startDate, endDate (optional - if not provided, get currently active promotions)
// Returns rooms that are available for new promotions (don't have conflicting active promotions)
export const getAvailableRoomsForPromo = async (req, res, next) => {
  try {
    console.log('🏨 getAvailableRoomsForPromo called');
    const { startDate, endDate } = req.query;

    // Default to current time if no dates provided
    const checkStart = startDate ? new Date(startDate) : new Date();
    const checkEnd = endDate ? new Date(endDate) : new Date();

    console.log('🏨 getAvailableRoomsForPromo - Checking period:', checkStart, 'to', checkEnd);

    // Find rooms that have active promotions overlapping with the check period
    const allRooms = await Room.find({}).select('MaPhong TenPhong LoaiPhong KhuyenMai').exec();

    const roomsWithConflictingPromos = allRooms.filter(room => {
      if (!room.KhuyenMai || !Array.isArray(room.KhuyenMai)) return false;
      return room.KhuyenMai.some(km => {
        if (km.TrangThai !== 'Hoạt động') return false;
        const start = km.NgayBatDau ? new Date(km.NgayBatDau) : null;
        const end = km.NgayKetThuc ? new Date(km.NgayKetThuc) : null;
        if (!start || !end) return false;
        return start <= checkEnd && end >= checkStart;
      });
    });

    console.log('🏨 getAvailableRoomsForPromo - Rooms with conflicting promotions:', roomsWithConflictingPromos.length);

    console.log('🏨 getAvailableRoomsForPromo - Rooms with conflicting promotions:', roomsWithConflictingPromos.length);

    // Get all rooms
    // const allRooms = await Room.find({}).select('MaPhong TenPhong LoaiPhong').exec();

    console.log('🏨 getAvailableRoomsForPromo - Total rooms:', allRooms.length);

    // Mark rooms as available/unavailable
    const result = allRooms.map(room => {
      const hasConflict = roomsWithConflictingPromos.some(conflictRoom =>
        conflictRoom.MaPhong === room.MaPhong
      );

      return {
        _id: room._id,
        MaPhong: room.MaPhong,
        TenPhong: room.TenPhong,
        LoaiPhong: room.LoaiPhong,
        available: !hasConflict,
        hasActivePromotion: hasConflict
      };
    });

    const availableCount = result.filter(r => r.available).length;
    const unavailableCount = result.filter(r => !r.available).length;

    console.log('🏨 getAvailableRoomsForPromo - Available rooms:', availableCount, 'Unavailable:', unavailableCount);

    return res.status(200).json({
      success: true,
      data: result,
      summary: {
        total: result.length,
        available: availableCount,
        unavailable: unavailableCount
      }
    });

  } catch (error) {
    console.error('Error getAvailableRoomsForPromo:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};

export default { getAllPromotions, getPromotionById, createPromotion, updatePromotion, getAvailableRoomsForPromo };
