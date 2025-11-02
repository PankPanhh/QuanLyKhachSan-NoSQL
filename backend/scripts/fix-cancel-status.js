import { loadEnv } from "../src/config/dotenv.js";
import { connectDB } from "../src/config/db.js";
import Booking from "../src/models/Booking.js";

async function run() {
  loadEnv();
  await connectDB();

  try {
    const filter = {
      $or: [
        { TrangThai: { $exists: false } },
        { TrangThai: null },
        { TrangThai: "" },
      ],
    };
    const update = { $set: { TrangThai: "Đã hủy" } };
    const res = await Booking.updateMany(filter, update);
    console.log("Update result:", res);
  } catch (err) {
    console.error("Error updating bookings:", err);
  } finally {
    process.exit(0);
  }
}

run();
