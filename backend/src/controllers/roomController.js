// controllers/roomController.js
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Room from "../models/Room.js";

// Controller: Lấy danh sách phòng (công khai, có phân trang cơ bản)
export const getAllRooms = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter: chỉ lấy document có MaPhong -> thực sự là phòng (không phải tiện nghi)
    const filter = { MaPhong: { $exists: true } };
    if (req.query.LoaiPhong) filter.LoaiPhong = req.query.LoaiPhong;
    if (req.query.Tang) filter.Tang = Number(req.query.Tang);
    if (req.query.TinhTrang) filter.TinhTrang = req.query.TinhTrang;
    if (req.query.minPrice)
      filter.GiaPhong = { $gte: Number(req.query.minPrice) };
    if (req.query.maxPrice) {
      filter.GiaPhong = filter.GiaPhong || {};
      filter.GiaPhong.$lte = Number(req.query.maxPrice);
    }

    console.log(
      `getAllRooms start - filter=${JSON.stringify(
        filter
      )} page=${page} limit=${limit}`
    );

    // Helper: wrap a promise with a timeout so slow DB queries don't hang the request
    const withTimeout = (p, ms = 7000) => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB query timeout")), ms)
      );
      return Promise.race([p, timeout]);
    };

    // Execute DB queries but fail fast if they exceed the timeout
    const findPromise = Room.find(filter).skip(skip).limit(limit).lean().exec();
    const countPromise = Room.countDocuments(filter).exec();

    let items, count;
    try {
      [items, count] = await Promise.all([
        withTimeout(findPromise),
        withTimeout(countPromise),
      ]);
    } catch (err) {
      console.error(
        "getAllRooms DB error or timeout:",
        err && err.message ? err.message : err
      );
      if (err && err.message && err.message.includes("DB query timeout")) {
        return res
          .status(504)
          .json({
            success: false,
            message: "Database timeout when fetching rooms",
          });
      }
      return res
        .status(500)
        .json({
          success: false,
          message: "Lỗi server khi truy vấn phòng",
          error: err.message || String(err),
        });
    }

    console.log(
      `getAllRooms success - found=${
        Array.isArray(items) ? items.length : 0
      } total=${count}`
    );

    const pages = Math.max(1, Math.ceil(count / limit));

    return res.status(200).json({ success: true, data: items, pages });
  } catch (error) {
    console.error("Lỗi getAllRooms:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Controller: tạo phòng (Admin)
export const createRoom = async (req, res) => {
  try {
    const payload = req.body;
    // Đảm bảo có LoaiTaiSan = 'Phong'
    payload.LoaiTaiSan = "Phong";
    const room = await Room.create(payload);
    return res.status(201).json({ success: true, data: room });
  } catch (error) {
    console.error("Lỗi createRoom:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Controller: cập nhật phòng (Admin)
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    const updated = await Room.findByIdAndUpdate(id, req.body, { new: true });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Lỗi updateRoom:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Controller: xóa phòng (Admin)
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    await Room.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Xóa phòng thành công" });
  } catch (error) {
    console.error("Lỗi deleteRoom:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    let room;
    if (mongoose.Types.ObjectId.isValid(id)) {
      room = await Room.findById(id);
    } else {
      // Nếu không phải ObjectId, tìm theo MaPhong
      room = await Room.findOne({ MaPhong: id });
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phòng",
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Lỗi getRoomById:", error); // In lỗi ra console
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
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
                      { $lt: ["$$booking.NgayNhanPhong", end] },
                      { $gt: ["$$booking.NgayTraPhong", start] },
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

// Controller: upload/overwrite room image (Admin)
export const uploadRoomImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID không hợp lệ" });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phòng" });
    }

    if (!req.file || !req.file.buffer) {
      return res
        .status(400)
        .json({ success: false, message: "Không có tệp ảnh được gửi" });
    }

    // Determine target filename: keep existing filename if present, otherwise use uploaded originalname
    const existingFilename =
      room.HinhAnh && room.HinhAnh.trim() ? room.HinhAnh.trim() : null;
    // sanitize filename to avoid path traversal
    const rawName = existingFilename || req.file.originalname;
    const filename = path.basename(rawName);

    // Resolve images/room directory under backend/src/assets (this matches static /assets mapping)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename); // backend/src/controllers
    const imagesRoomDir = path.join(
      __dirname,
      "..",
      "assets",
      "images",
      "room"
    );

    // Ensure images/room dir exists
    await fs.mkdir(imagesRoomDir, { recursive: true });

    const destPath = path.join(imagesRoomDir, filename);

    // Write file buffer to destination (this will overwrite existing file)
    await fs.writeFile(destPath, req.file.buffer);
    console.log(`uploadRoomImage: wrote file to ${destPath}`);

    // If room didn't have HinhAnh set, update it to the new filename
    if (!existingFilename) {
      room.HinhAnh = filename;
      await room.save();
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Ảnh phòng đã được cập nhật",
        data: { HinhAnh: filename },
      });
  } catch (error) {
    console.error("Lỗi uploadRoomImage:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Lỗi server khi upload ảnh",
        error: error.message,
      });
  }
};
