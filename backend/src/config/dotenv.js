import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

export const loadEnv = () => {
  // Xác định đường dẫn tuyệt đối đến thư mục gốc của backend
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Đi lùi 2 cấp (từ src/config -> backend/) để tìm file .env
  const envPath = path.resolve(__dirname, '../../.env');

  dotenv.config({ path: envPath });
};
