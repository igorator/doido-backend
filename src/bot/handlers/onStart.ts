import { readFileSync } from 'fs';
import path from 'path';
import { Bot, Context, InlineKeyboard, InputFile } from 'grammy';

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

    const helloDuck = new InputFile(
      readFileSync(path.join(__dirname, '../../../assets/images/hello.webp')),
    );

    const keyboard = new InlineKeyboard()
      .url('🛍 Launch Marketplace', 'https://t.me/doido_marketplace_bot/start')
      .url('📢 Join our channel', 'https://t.me/doido_marketplace');

    await ctx.replyWithPhoto(helloDuck, {
      caption:
        '👋 Welcome to **DOIDO Market**!\n\nBuy, sell and collect unique gifts powered by Telegram & TON.',
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });
};
