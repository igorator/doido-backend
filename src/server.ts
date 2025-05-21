import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { webhookCallback } from 'grammy';
import { bot } from './bot/bot';

import userRouter from './routes/userRoutes';
import giftRouter from './routes/giftRoutes';
import pricingRouter from './routes/pricingRoutes';
import activityRouter from './routes/activityRoutes';
import serverRouter from './routes/serverRoutes';
import helmet from 'helmet';

console.log('🔔 Загрузка server.ts');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

const assetsPath = path.resolve(__dirname, '../assets');

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(assetsPath));

app.use('/webhook', webhookCallback(bot, 'express'));

app.use('/server', serverRouter);
app.use('/users', userRouter);
app.use('/gifts', giftRouter);
app.use('/pricing', pricingRouter);
app.use('/activity', activityRouter);

app.get('/', (_req, res) => {
  res.send('🎁 Express сервер работает!');
});

export function startServer() {
  app.listen(PORT, async () => {
    console.log(`🚀 Express server is running on http://localhost:${PORT}`);

    const externalUrl =
      process.env.RENDER_EXTERNAL_URL || process.env.WEBHOOK_URL;

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
