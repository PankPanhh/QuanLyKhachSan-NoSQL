import Room from "../models/Room.js";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import Booking from "../models/Booking.js";
import { calculateRoomPriceWithDiscount } from "../utils/calculateTotal.js";

// GET /api/v1/rooms - list rooms
export const getAllRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({}).sort({ TenPhong: 1 }).lean();
    return res.status(200).json(rooms);
  } catch (error) {
    console.error("Error getAllRooms:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Controller: Kiểm tra phòng trống theo khoảng thời gian
export const getAvailableRooms = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp startDate và endDate",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Định dạng ngày không hợp lệ",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "startDate phải nhỏ hơn endDate",
      });
    }

    const activeStatuses = ["Đang chờ", "Đang sử dụng"];

    const pipeline = [
      {
        $match: {
          MaPhong: { $exists: true },
          TinhTrang: "Trống",
        },
      },
      {
        $lookup: {
          from: "DatPhong",
          localField: "MaPhong",
          foreignField: "MaPhong",
          as: "bookings",
        },
      },
      {
        $addFields: {
          isAvailable: {
            $not: {
              $anyElementTrue: {
                $map: {
                  input: "$bookings",
                  as: "booking",
                  in: {
                    $and: [
                      { $in: ["$$booking.TrangThai", activeStatuses] },
                      { $lte: ["$$booking.NgayNhanPhong", end] },
                      { $gte: ["$$booking.NgayTraPhong", start] },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      {
        $match: {
          isAvailable: true,
        },
      },
      {
        $project: {
          _id: 1,
          MaPhong: 1,
          TenPhong: 1,
          LoaiPhong: 1,
          GiaPhong: 1,
          SoGiuong: 1,
          MoTa: 1,
          HinhAnh: 1,
        },
      },
    ];

    console.log("--- Running Aggregation Pipeline ---");
    const availableRooms = await Room.aggregate(pipeline);
    console.log(`Found ${availableRooms.length} available rooms.`);

    // Log từng bước để debug
    const step1 = await Room.aggregate([pipeline[0]]).exec();
    console.log(`Step 1 ($match TinhTrang): Found ${step1.length} rooms.`);

    const step2 = await Room.aggregate(pipeline.slice(0, 2)).exec();
    console.log(
      `Step 2 ($lookup): Found ${step2.length} rooms, check bookings field.`
    );
    // console.log(JSON.stringify(step2.slice(0, 2), null, 2)); // Log sample data after lookup

    const step3 = await Room.aggregate(pipeline.slice(0, 3)).exec();
    console.log(
      `Step 3 ($addFields isAvailable): Found ${step3.length} rooms.`
    );
    // console.log(JSON.stringify(step3.filter(r => !r.isAvailable).slice(0, 2), null, 2)); // Log unavailable rooms

    const step4 = await Room.aggregate(pipeline.slice(0, 4)).exec();
    console.log(`Step 4 ($match isAvailable): Found ${step4.length} rooms.`);

    return res.status(200).json({
      success: true,
      data: availableRooms,
    });
  } catch (error) {
    console.error("Lỗi getAvailableRooms:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
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
    if (!filter)
      return res.status(400).json({ success: false, message: "Thiếu id" });
    const room = await Room.findOne(filter).lean();
    if (!room)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng" });
    return res.status(200).json({ success: true, data: room });
  } catch (error) {
    console.error("Error getRoomById:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// POST /api/v1/rooms
export const createRoom = async (req, res, next) => {
  try {
    const required = ["MaPhong", "TenPhong", "LoaiPhong", "GiaPhong"];
    const missing = required.filter(
      (k) =>
        !Object.hasOwn(req.body, k) ||
        req.body[k] === "" ||
        req.body[k] === null
    );
    if (missing.length)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields", missing });

    const room = await Room.create(req.body);
    return res.status(201).json({ success: true, data: room });
  } catch (error) {
    console.error("Error createRoom:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// PUT /api/v1/rooms/:id
export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filter = findRoomFilter(id);
    if (!filter)
      return res.status(400).json({ success: false, message: "Thiếu id" });
    const updated = await Room.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true }
    ).lean();
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng để cập nhật" });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updateRoom:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// DELETE /api/v1/rooms/:id
export const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filter = findRoomFilter(id);
    if (!filter)
      return res.status(400).json({ success: false, message: "Thiếu id" });
    const del = await Room.findOneAndDelete(filter).lean();
    if (!del)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng để xóa" });
    return res
      .status(200)
      .json({ success: true, message: "Đã xóa phòng", data: del });
  } catch (error) {
    console.error("Error deleteRoom:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// PUT /api/v1/rooms/:id/image - upload/overwrite image (multer memory storage expected)
export const uploadRoomImage = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: "Không có file" });
    const { id } = req.params;
    const filter = findRoomFilter(id);
    if (!filter)
      return res.status(400).json({ success: false, message: "Thiếu id" });

    const filename = `${Date.now()}_${req.file.originalname.replace(
      /\s+/g,
      "_"
    )}`;
    const imagesDir = path.join(
      process.cwd(),
      "src",
      "assets",
      "images",
      "room"
    );
    await fs.mkdir(imagesDir, { recursive: true });
    const dest = path.join(imagesDir, filename);
    await fs.writeFile(dest, req.file.buffer);

    // Push to HinhAnh array
    const updated = await Room.findOneAndUpdate(
      filter,
      { $push: { HinhAnh: filename } },
      { new: true }
    ).lean();
    return res.status(200).json({ success: true, filename, data: updated });
  } catch (error) {
    console.error("Error uploadRoomImage:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// GET /api/v1/rooms/:id/availability - Kiểm tra phòng có sẵn trong khoảng thời gian
export const checkRoomAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp startDate và endDate",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Định dạng ngày không hợp lệ",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "startDate phải nhỏ hơn endDate",
      });
    }

    // Tìm phòng
    const filter = findRoomFilter(id);
    if (!filter) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }

    const room = await Room.findOne(filter).lean();
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phòng",
      });
    }

    // Kiểm tra booking đang active (Đang chờ hoặc Đang sử dụng)
    const activeStatuses = ["Đang chờ", "Đang sử dụng"];

    const conflictBooking = await Booking.findOne({
      MaPhong: room.MaPhong,
      TrangThai: { $in: activeStatuses },
      NgayNhanPhong: { $lte: end },
      NgayTraPhong: { $gte: start },
    }).lean();

    const isAvailable = !conflictBooking;

    return res.status(200).json({
      success: true,
      available: isAvailable,
      room: {
        _id: room._id,
        MaPhong: room.MaPhong,
        TenPhong: room.TenPhong,
        LoaiPhong: room.LoaiPhong,
        GiaPhong: room.GiaPhong,
      },
      message: isAvailable
        ? "Phòng còn trống trong khoảng thời gian này"
        : "Phòng đã được đặt trong khoảng thời gian này",
      conflictBooking: conflictBooking
        ? {
            MaDatPhong: conflictBooking.MaDatPhong,
            NgayNhanPhong: conflictBooking.NgayNhanPhong,
            NgayTraPhong: conflictBooking.NgayTraPhong,
            TrangThai: conflictBooking.TrangThai,
          }
        : null,
    });
  } catch (error) {
    console.error("Lỗi checkRoomAvailability:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// GET /api/v1/rooms/:id/price?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&numRooms=1
export const getRoomPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, numRooms, extraServices } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp checkIn và checkOut",
      });
    }

    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    if (isNaN(ci.getTime()) || isNaN(co.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Ngày không hợp lệ" });
    }

    const filter = findRoomFilter(id);
    if (!filter)
      return res
        .status(400)
        .json({ success: false, message: "ID phòng không hợp lệ" });

    const room = await Room.findOne(filter).lean();
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng" });
    }

    const nRooms = Number(numRooms) || 1;

    const price = calculateRoomPriceWithDiscount(room, ci, co, nRooms);

    // Process extraServices (optional) - expected as JSON stringified array of { MaDichVu, SoLuong }
    let serviceTotal = 0;
    let servicesDetail = [];
    if (extraServices) {
      try {
        const parsed = JSON.parse(extraServices);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const rs of parsed) {
            if (!rs || !rs.MaDichVu) continue;
            const svc = (room.DichVu || []).find(
              (d) =>
                d.MaDichVu === rs.MaDichVu && d.TrangThai === "Đang hoạt động"
            );
            if (!svc) continue;
            const qty = Math.max(0, Number(rs.SoLuong || 1));
            const pricePer = Number(svc.GiaDichVu || 0);
            const line = pricePer * qty;
            serviceTotal += line;
            servicesDetail.push({
              MaDichVu: svc.MaDichVu,
              TenDichVu: svc.TenDichVu,
              GiaDichVu: pricePer,
              SoLuong: qty,
              ThanhTien: line,
            });
          }
        }
      } catch (e) {
        console.warn("Invalid extraServices param for price endpoint", e);
      }
    }

    // Optional debug info: include promotions with normalized ranges and overlap flag
    const debug = String(req.query.debug || "").toLowerCase();
    if (debug === "1" || debug === "true" || debug === "yes") {
      const stayStart = new Date(ci);
      stayStart.setHours(0, 0, 0, 0);
      const stayEndInclusive = new Date(co.getTime() - 1);
      stayEndInclusive.setHours(23, 59, 59, 999);

      const promos = (room.KhuyenMai || []).map((km) => {
        const start = km.NgayBatDau ? new Date(km.NgayBatDau) : null;
        const end = km.NgayKetThuc ? new Date(km.NgayKetThuc) : null;
        const promoStart = start ? new Date(start) : null;
        if (promoStart) promoStart.setHours(0, 0, 0, 0);
        const promoEnd = end ? new Date(end) : null;
        if (promoEnd) promoEnd.setHours(23, 59, 59, 999);
        const overlaps =
          (!promoStart || promoStart <= stayEndInclusive) &&
          (!promoEnd || promoEnd >= stayStart) &&
          km.TrangThai === "Hoạt động";
        return {
          MaKhuyenMai: km.MaKhuyenMai,
          TenChuongTrinh: km.TenChuongTrinh || km.TenKM,
          TrangThai: km.TrangThai,
          rawStart: km.NgayBatDau || null,
          rawEnd: km.NgayKetThuc || null,
          promoStart: promoStart ? promoStart.toISOString() : null,
          promoEnd: promoEnd ? promoEnd.toISOString() : null,
          overlaps,
          LoaiGiamGia: km.LoaiGiamGia || km.LoaiKhuyenMai || null,
          GiaTriGiam: km.GiaTriGiam != null ? km.GiaTriGiam : km.GiaTri || null,
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          ...price,
          serviceTotal,
          servicesDetail,
          grandTotal:
            (price.discountedTotal || price.originalTotal || 0) + serviceTotal,
        },
        debug: { roomId: room.MaPhong || room._id, promos },
      });
    }

    // Return price with optional service aggregation
    return res.status(200).json({
      success: true,
      data: {
        ...price,
        serviceTotal,
        servicesDetail,
        grandTotal:
          (price.discountedTotal || price.originalTotal || 0) + serviceTotal,
      },
    });
  } catch (error) {
    console.error("Error getRoomPrice:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};
