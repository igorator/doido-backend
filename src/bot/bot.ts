import { Bot } from 'grammy';
import { limit } from '@grammyjs/ratelimiter';
import { autoRetry } from '@grammyjs/auto-retry';
import { setupBotHandlers } from './handlers/setupHandlers';
import { config } from '../config';

if (!config.telegram.botToken) {
  throw new Error('❌ TELEGRAM_BOT_TOKEN is not defined');
}

export const bot = new Bot(config.telegram.botToken);

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
