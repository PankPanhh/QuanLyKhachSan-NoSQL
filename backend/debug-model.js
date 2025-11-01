import mongoose from "mongoose";
import Room from "./src/models/Room.js";

const run = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/QuanLyKhachSan");
    const docs = await Room.find({ MaPhong: { $exists: true } }).lean();
    console.log("Room.find count:", docs.length);
    console.log(docs.slice(0, 3));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
