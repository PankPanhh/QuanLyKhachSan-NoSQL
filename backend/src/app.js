import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from './config/dotenv.js';
import { errorHandler } from './middleware/errorHandler.js';

// Để sử dụng __dirname với ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tải biến môi trường (cần cho CORS và các routes)
loadEnv();

// Import routes (sau khi đã load env)
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import amenitiesRoutes from './routes/amenitiesRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import reportRoutes from './routes/reportRoutes.js'; // Đảm bảo reportRoutes được import

const app = express();

// --- Middlewares ---

// 1. CORS
// Cần cấu hình cho phép frontend (ví dụ: http://localhost:5173)
const corsOptions = {
  // Nên lấy từ biến môi trường FRONTEND_URL
  // In development, allow any origin for convenience. In production, set FRONTEND_URL.
  origin: process.env.NODE_ENV === 'production' ? (process.env.FRONTEND_URL || 'http://localhost:5173') : true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 2. Body Parsers
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// 3. Static Files - Serve images từ assets
// Serve room images with no-cache so overwritten files are fetched immediately by browsers
app.use(
  '/assets/images/room',
  express.static(path.join(__dirname, 'assets', 'images', 'room'), {
    setHeaders: (res, filePath) => {
      // Force browsers to always revalidate / not aggressively cache room images
      res.setHeader('Cache-Control', 'no-store, max-age=0');
    },
  })
);

// Serve service images with no-store as well so edits show immediately in the admin UI
app.use(
  '/assets/images/services',
  express.static(path.join(__dirname, 'assets', 'images', 'services'), {
    setHeaders: (res, filePath) => {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
    },
  })
);

// Fallback static serving for other assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

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
app.use('/api/v1/amenities', amenitiesRoutes);

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

