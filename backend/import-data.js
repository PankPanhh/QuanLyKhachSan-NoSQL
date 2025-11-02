import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`DB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Helper function to convert MongoDB extended JSON
const convertMongoExtendedJSON = (obj) => {
  if (obj && typeof obj === "object") {
    if (obj.$oid) {
      return obj.$oid;
    }
    if (obj.$date) {
      return new Date(obj.$date);
    }
    if (Array.isArray(obj)) {
      return obj.map(convertMongoExtendedJSON);
    }
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertMongoExtendedJSON(value);
    }
    return converted;
  }
  return obj;
};

// Import data from JSON files
const importData = async () => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dataDir = path.join(__dirname, "..", "db");

    // Import NguoiDung
    const nguoiDungRaw = JSON.parse(
      fs.readFileSync(
        path.join(dataDir, "QuanLyKhachSan.NguoiDung.json"),
        "utf8"
      )
    );
    const nguoiDungData = nguoiDungRaw.map(convertMongoExtendedJSON);
    const NguoiDung = mongoose.model(
      "NguoiDung",
      new mongoose.Schema({}, { strict: false }),
      "NguoiDung"
    );
    await NguoiDung.deleteMany({});
    await NguoiDung.insertMany(nguoiDungData);
    console.log(`Imported ${nguoiDungData.length} users`);

    // Import Phong
    const phongRaw = JSON.parse(
      fs.readFileSync(path.join(dataDir, "QuanLyKhachSan.Phong.json"), "utf8")
    );
    const phongData = phongRaw.map(convertMongoExtendedJSON);
    const Phong = mongoose.model(
      "Phong",
      new mongoose.Schema({}, { strict: false }),
      "Phong"
    );
    await Phong.deleteMany({});
    await Phong.insertMany(phongData);
    console.log(`Imported ${phongData.length} rooms`);

    // Import DatPhong
    const datPhongRaw = JSON.parse(
      fs.readFileSync(
        path.join(dataDir, "QuanLyKhachSan.DatPhong.json"),
        "utf8"
      )
    );
    const datPhongData = datPhongRaw.map(convertMongoExtendedJSON);
    const DatPhong = mongoose.model(
      "DatPhong",
      new mongoose.Schema({}, { strict: false }),
      "DatPhong"
    );
    await DatPhong.deleteMany({});
    await DatPhong.insertMany(datPhongData);
    console.log(`Imported ${datPhongData.length} bookings`);

    console.log("Data import completed successfully!");
  } catch (error) {
    console.error("Error importing data:", error);
  }
};

// Run the import
const runImport = async () => {
  await connectDB();
  await importData();
  process.exit(0);
};

runImport();
