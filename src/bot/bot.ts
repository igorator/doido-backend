import { Bot } from 'grammy';
import { config } from 'dotenv';
import { limit } from '@grammyjs/ratelimiter';
import { autoRetry } from '@grammyjs/auto-retry';
import { setupBotHandlers } from './handlers/setupHandlers';

config();

export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

bot.api.config.use(autoRetry());
bot.use(limit());

setupBotHandlers(bot);

bot.catch((err) => {
  console.error(
    `❌ Error in update ${err.ctx?.update?.update_id ?? 'unknown update'}`,
  );
  if (err.error instanceof Error) {
    console.error('→', err.error.message);
  } else {
    console.error('→ Non-standard error:', err.error);
  }
});
