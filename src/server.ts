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

console.log('🔔 Загрузка server.ts');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
const assetsPath = path.resolve(__dirname, '../assets');

const app = express();

app.use(
  cors({
    origin: [
      'https://doido-market.com',
      'https://www.doido-market.com',
      'https://doido-marketplace.onrender.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(express.json());

app.use('/assets', express.static(assetsPath));

app.use('/webhook', webhookCallback(bot, 'express'));
app.use('/server', serverRouter);
app.use('/ton', tonRouter);
app.use('/users', userRouter);
app.use('/gifts', giftRouter);
app.use('/pricing', pricingRouter);
app.use('/activity', activityRouter);

app.get('/', (_req, res) => {
  res.send('🎁 Работаем');
});

export function startServer() {
  app.listen(PORT, async () => {
    console.log(`🚀 Express server is running on ${PORT}`);

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
