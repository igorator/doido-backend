import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import userRouter from './routes/userRoutes';
import giftRouter from './routes/giftRoutes';
import pricingRouter from './routes/pricingRoutes';
import activityRouter from './routes/activityRoutes';

console.log('🔔 Загрузка server.ts');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

const assetsPath = path.resolve(__dirname, '../assets');
app.use('/assets', express.static(assetsPath));

app.use(cors());
app.use(express.json());
app.use('/users', userRouter);
app.use('/gifts', giftRouter);
app.use('/pricing', pricingRouter);
app.use('/activity', activityRouter);

app.get('/', (_req, res) => {
  res.send('🎁 Express сервер работает!');
});

export function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Express server is running on http://localhost:${PORT}`);
  });
}
