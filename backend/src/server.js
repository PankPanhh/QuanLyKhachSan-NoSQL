
import { loadEnv } from './config/dotenv.js';
loadEnv();

const { connectDB } = await import('./config/db.js');
await connectDB();

const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server dang chay tai http://localhost:${PORT}`);
});
