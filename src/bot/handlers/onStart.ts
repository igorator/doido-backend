import { Bot, Context, InlineKeyboard } from 'grammy';
import { config } from '../../config';

export const onStart = (bot: Bot) => {
  bot.command('start', async (ctx: Context) => {
    await ctx.replyWithPhoto(
      'https://api.doido-market.com/assets/images/hello.webp',
      {
        caption:
          '👋 Welcome to **DOIDO Market**!\n\nBuy, sell and collect unique gifts powered by Telegram & TON.\n\n👇 Tap below to launch app:',
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .row(
            InlineKeyboard.url(
              '🐣 Launch Doido',
              'https://t.me/doido_marketplace_bot?startapp=gifts',
            ),
          )
          .row(
            InlineKeyboard.url(
              '📢 Check latest news',
              config.telegram.channelUrl,
            ),
          ),
      },
    );
  });
};
