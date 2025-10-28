import app from './app.js';
import { connectDB } from './config/db.js';
import { loadEnv } from './config/dotenv.js';

// Tải biến môi trường
loadEnv();

// Kết nối CSDL
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server dang chay tai http://localhost:${PORT}`);
});
