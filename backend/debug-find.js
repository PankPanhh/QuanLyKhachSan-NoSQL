import mongoose from "mongoose";

const run = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/QuanLyKhachSan");
    const db = mongoose.connection.db;
    const docs = await db
      .collection("Phong")
      .find({ MaPhong: { $exists: true } })
      .toArray();
    console.log("matched count:", docs.length);
    console.log("sample:", docs.slice(0, 5));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
