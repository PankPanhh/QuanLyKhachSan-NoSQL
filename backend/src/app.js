import express from 'express';
import cors from 'cors';
import { loadEnv } from './config/dotenv.js';
import { errorHandler } from './middleware/errorHandler.js';

// Tải biến môi trường (cần cho CORS và các routes)
loadEnv();

// Import routes (sau khi đã load env)
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import reportRoutes from './routes/reportRoutes.js'; // Đảm bảo reportRoutes được import

const app = express();

// --- Middlewares ---

// 1. CORS
// Cần cấu hình cho phép frontend (ví dụ: http://localhost:5173)
const corsOptions = {
  // Nên lấy từ biến môi trường FRONTEND_URL
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 2. Body Parsers
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('API Khach san dang hoat dong!');
});

// Gắn các routes vào đường dẫn gốc /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/promotions', promoRoutes);
app.use('/api/v1/reports', reportRoutes); // Gắn reportRoutes

// --- Error Handling ---
// 404 Not Found (Phải đặt trước errorHandler)
app.use((req, res, next) => {
  const error = new Error(`Khong tim thay - ${req.originalUrl}`);
  res.status(404);
  next(error); // Chuyển lỗi xuống errorHandler
});

// Trình xử lý lỗi chung (Phải đặt cuối cùng)
app.use(errorHandler);

export default app;

