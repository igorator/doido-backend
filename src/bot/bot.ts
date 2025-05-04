// src/bot/bot.ts
import { Bot } from 'grammy';
import { config } from 'dotenv';
import { limit } from '@grammyjs/ratelimiter';
import { autoRetry } from '@grammyjs/auto-retry';
import { run } from '@grammyjs/runner';
import { setupBotHandlers } from './handlers/setupHandlers';

config();

export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

bot.api.config.use(autoRetry());
bot.use(limit());

setupBotHandlers(bot);

bot.catch((err) => {
  console.error(`❌ Error in update ${err.ctx.update.update_id}`);
  if (err.error instanceof Error) {
    console.error('→', err.error.message);
  } else {
    console.error('→ Non-standard error:', err.error);
  }
});

const runner = run(bot);

const stopRunner = () => runner.isRunning() && runner.stop();
process.once('SIGINT', stopRunner);
process.once('SIGTERM', stopRunner);
