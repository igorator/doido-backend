import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🔔 Загрузка server.ts');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // ✅ Fix CORS
app.use(express.json());

const assetsPath = path.resolve(__dirname, '../assets');
app.use('/assets', express.static(assetsPath));

app.get('/', (_req, res) => {
  res.send('🎁 Express сервер работает!');
});

export function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Express server is running on http://localhost:${PORT}`);
  });
}
