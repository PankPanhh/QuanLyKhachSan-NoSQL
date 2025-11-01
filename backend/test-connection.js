// Test script để kiểm tra dữ liệu trong MongoDB
import mongoose from 'mongoose';

async function testConnection() {
  try {
    // Kết nối đến MongoDB
    await mongoose.connect('mongodb://localhost:27017/QuanLyKhachSan');
    console.log('✅ Kết nối MongoDB thành công');

    // Liệt kê tất cả collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Danh sách collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Kiểm tra collection Phong
    const phongCollection = db.collection('Phong');
    const phongCount = await phongCollection.countDocuments();
    console.log(`\n🏨 Collection 'Phong': ${phongCount} documents`);

    if (phongCount > 0) {
      const samplePhong = await phongCollection.findOne();
      console.log('📄 Sample document từ collection Phong:');
      console.log(JSON.stringify(samplePhong, null, 2));
    }

    // Kiểm tra collection NguoiDung
    const nguoiDungCollection = db.collection('NguoiDung');
    const nguoiDungCount = await nguoiDungCollection.countDocuments();
    console.log(`\n👤 Collection 'NguoiDung': ${nguoiDungCount} documents`);

    // Kiểm tra collection DatPhong
    const datPhongCollection = db.collection('DatPhong');
    const datPhongCount = await datPhongCollection.countDocuments();
    console.log(`\n📅 Collection 'DatPhong': ${datPhongCount} documents`);

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối MongoDB');
    process.exit(0);
  }
}

testConnection();