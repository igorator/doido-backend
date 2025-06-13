import { Bot, Context, InlineKeyboard } from 'grammy';

export const onStart = (bot: Bot) => {
  bot.command('start', async (ctx: Context) => {
    await ctx.replyWithPhoto(
      'https://api.doido-market.com/assets/images/hello.webp',
      {
        caption:
          '👋 Welcome to **DOIDO Market**!\n\nBuy, sell and collect unique gifts powered by Telegram & TON.',
        parse_mode: 'Markdown',
      },
    );

    await ctx.reply('👇 Tap below to launch app:', {
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
            process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/doido_ann',
          ),
        ),
    });
  });
};
