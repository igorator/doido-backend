import { Bot, Context, InlineKeyboard } from 'grammy';
import { config } from '../../config';

const WELCOME_PHOTO_URL = 'https://api.doido-market.com/assets/images/hello.webp';
const LAUNCH_APP_URL = 'https://t.me/doido_marketplace_bot?startapp=gifts';
const WELCOME_CAPTION =
  '👋 Welcome to **DOIDO Market**!\n\nBuy, sell and collect unique gifts powered by Telegram & TON.\n\n👇 Tap below to launch app:';

export const onStart = (bot: Bot) => {
  bot.command('start', async (ctx: Context) => {
    await ctx.replyWithPhoto(WELCOME_PHOTO_URL, {
      caption: WELCOME_CAPTION,
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .row(InlineKeyboard.url('🐣 Launch Doido', LAUNCH_APP_URL))
        .row(InlineKeyboard.url('📢 Check latest news', config.telegram.channelUrl)),
    });
  });
};
