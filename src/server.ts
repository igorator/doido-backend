import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { webhookCallback } from 'grammy';
import { bot } from './bot/bot';
import userRouter from './routes/userRoutes';
import giftRouter from './routes/giftRoutes';
import pricingRouter from './routes/pricingRoutes';
import activityRouter from './routes/activityRoutes';
import serverRouter from './routes/serverRoutes';
import tonRouter from './routes/tonRoutes';
import { setupSockets } from './sockets/initSocketServer';
import { slowDown } from 'express-slow-down';
console.log('🔔 Загрузка server.ts');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || process.env.SERVER_PORT || 8080;
const assetsPath = path.resolve(__dirname, '../assets');

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 1500,
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 100;
  },
});
const app = express();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'development'
        ? true
        : ['https://doido-market.com', 'https://www.doido-market.com'],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(express.json());

app.use(speedLimiter);

app.use('/assets', express.static(assetsPath));
app.use('/webhook', webhookCallback(bot, 'express'));
app.use('/server', serverRouter);
app.use('/ton', tonRouter);
app.use('/users', userRouter);
app.use('/gifts', giftRouter);
app.use('/pricing', pricingRouter);
app.use('/activity', activityRouter);

app.get('/', (_req, res) => {
  res.send('🐣 HELLO 🐣');
});

export function startServer() {
  const server = setupSockets(app);

  server.listen(PORT, async () => {
    console.log(`🚀 Express + Socket.IO server running on ${PORT}`);

    const externalUrl =
      process.env.BOT_WEBHOOK_URL || 'https://api.doido-market.com';

    if (!externalUrl) {
      console.warn(
        '⚠️ Внешний URL не задан (RENDER_EXTERNAL_URL или WEBHOOK_URL)',
      );
      return;
    }

    const fullWebhookUrl = `${externalUrl.replace(/\/$/, '')}/webhook`;

    try {
      await bot.api.setWebhook(fullWebhookUrl);
      console.log(`✅ Webhook установлен на ${fullWebhookUrl}`);
    } catch (err) {
      console.error('❌ Ошибка при установке webhook:', err);
    }
  });
}
