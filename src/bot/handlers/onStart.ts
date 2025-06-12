import { Bot, Context, InlineKeyboard } from 'grammy';

export const onStart = (bot: Bot) => {
  bot.command('start', async (ctx: Context) => {
    await ctx.replyWithPhoto(
      'https://api.doido-market.com/assets/images/hello.webp',
      {
        caption:
          '👋 Welcome to **DOIDO Market**!\n\nBuy, sell and collect unique gifts powered by Telegram & TON.',
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .row(
            InlineKeyboard.webApp(
              '🐣 Launch Doido',
              'https://doido-market.com',
            ),
          )
          .row(
            InlineKeyboard.url(
              '📢 Check latest news',
              process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/doido_ann',
            ),
          ),
      },
    );
  });
};
