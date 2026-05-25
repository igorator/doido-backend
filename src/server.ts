import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { webhookCallback } from 'grammy';
import { slowDown } from 'express-slow-down';
import { bot } from './bot/bot';
import {
  userRouter,
  giftRouter,
  pricingRouter,
  activityRouter,
  serverRouter,
  tonRouter,
  leaderboardRouter,
} from './routes';
import { setupSockets } from './sockets/initSocketServer';
import { config } from './config';

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

const globalLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 60,
  delayMs: (hits) => (hits - 60) * 100,
});

const strictLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 10,
  delayMs: (hits) => (hits - 10) * 500,
});

app.use('/assets', express.static(assetsPath));
app.use('/webhook', webhookCallback(bot, 'express'));

app.use('/server', serverRouter);
app.use('/pricing', pricingRouter);
app.use('/leaderboard', leaderboardRouter);

app.use('/gifts/buy', strictLimiter);
app.use('/gifts/:gift_id/transfer', strictLimiter);
app.use('/users/auth', strictLimiter);

app.use('/users', globalLimiter, userRouter);
app.use('/activity', globalLimiter, activityRouter);
app.use('/gifts', globalLimiter, giftRouter);

app.use('/ton', strictLimiter, tonRouter);

app.get('/', (_req, res) => {
  res.send('🐣 HELLO 🐣');
});

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('💥 Uncaught error:', err);
    res.status(500).json({ error: 'Internal server error' });
  },
);

export function startServer() {
  const server = setupSockets(app);

  server.listen(config.server.port, async () => {
    console.log(`🚀 Express + Socket.IO server running on port ${config.server.port}`);

    const externalUrl = config.telegram.webhookUrl;

    if (!externalUrl) {
      console.warn('⚠️ Webhook URL not set (BOT_WEBHOOK_URL)');
      return;
    }

    const fullWebhookUrl = `${externalUrl.replace(/\/$/, '')}/webhook`;

    try {
      await bot.api.setWebhook(fullWebhookUrl);
      console.log(`✅ Webhook set to ${fullWebhookUrl}`);
    } catch (err) {
      console.error('❌ Failed to set webhook:', err);
    }
  });
}
