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
import leaderboardRouter from './routes/leaderboardRoutes';
import { setupSockets } from './sockets/initSocketServer';
import { config } from './config';

console.log('🔔 Загрузка server.ts');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsPath = path.resolve(__dirname, '../assets');

const app = express();

app.use(
  cors({
    origin: config.server.isDev
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

app.use('/assets', express.static(assetsPath));
app.use('/webhook', webhookCallback(bot, 'express'));
app.use('/server', serverRouter);
app.use('/ton', tonRouter);
app.use('/users', userRouter);
app.use('/gifts', giftRouter);
app.use('/pricing', pricingRouter);
app.use('/activity', activityRouter);
app.use('/leaderboard', leaderboardRouter);

app.get('/', (_req, res) => {
  res.send('🐣 HELLO 🐣');
});

export function startServer() {
  const server = setupSockets(app);

  server.listen(config.server.port, async () => {
    console.log(
      `🚀 Express + Socket.IO server running on ${config.server.port}`,
    );

    const externalUrl = config.telegram.webhookUrl;

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

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('💥 Uncaught error:', err);
    res.status(500).json({ error: 'Internal server error' });
  },
);
