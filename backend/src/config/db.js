import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB da ket noi: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Loi ket noi DB: ${error.message}`);
    process.exit(1); // Thoát khỏi tiến trình nếu không kết nối được
  }
};
