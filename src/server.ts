import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import userRouter from './routes/userRoutes';
import giftRouter from './routes/giftRoutes';
import pricigRouter from './routes/pricingRoutes';
import authRouter from './routes/authRoutes';

console.log('🔔 Загрузка server.ts');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/users', userRouter);
app.use('/gifts', giftRouter);
app.use('/pricing', pricigRouter);
app.use('/auth', authRouter);

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
