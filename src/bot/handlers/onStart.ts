import { Bot, Context, InlineKeyboard } from 'grammy';

export const onStart = (bot: Bot) => {
  bot.command('start', async (ctx: Context) => {
    const payload = typeof ctx.match === 'string' ? ctx.match : ctx.match?.[0];
    const user = ctx.from;

    console.log(`[Bot] /start from ${user.id}, payload: ${payload}`);

    if (payload?.startsWith('ref_')) {
      const referredBy = payload.replace('ref_', '');
      //   if (user.id.toString() !== referredBy) {
      //     console.log(`[Referral] User ${user.id} was referred by ${referredBy}`);
      //   } else {
      //     console.log(`[Referral] ⛔ User tried to refer themselves`);
      //   }
    }

    await ctx.replyWithPhoto(
      'https://api.doido-market.com/assets/images/hello.webp',
      {
        caption:
          '👋 Welcome to **DOIDO Market**!\n\nBuy, sell and collect unique gifts powered by Telegram & TON.',
        parse_mode: 'Markdown',
        reply_markup: new InlineKeyboard()
          .url('🐣 Launch Doido', 'https://t.me/doido_marketplace_bot/start')
          .url(
            '📢 Check latest news',
            process.env.TELEGRAM_CHANNEL_URL || 'https://t.me/doido_ann',
          ),
      },
    );
  });
};
