import { Bot, Context } from 'grammy';
import { userRepository } from '../../../database/repositories/userRepository';
import { saveGiftToDatabase } from '../../../services/gifts/saveGiftToDatabase';

export const onGiftRouter = (bot: Bot) => {
  bot.on('business_message', async (ctx: Context) => {
    const giftPayload = ctx.businessMessage?.unique_gift;

    if (!giftPayload) {
      return;
    }

    const giftId = giftPayload.owned_gift_id || ctx.businessMessage.message_id;
    const gift = giftPayload.gift;
    const senderId = ctx.from?.id;
    const userId = String(senderId);
    const collectionName = gift.base_name;
    const giftNumber = gift.number;

    if (!giftId || !gift || ctx.businessMessage.message_id) {
      console.warn(
        `⚠️ Подарок не был добавлен 
        giftId: ${giftId} 
        gift: ${gift}
        sender id: ${senderId}
        collection name: ${collectionName}
        gift number: ${giftNumber}`,
      );
      return;
    }

    let logPrefix = `🎁 GIFT IN | id=${giftId} | collection="${collectionName}" | number=${giftNumber} | from=${userId}`;

    let connection;
    try {
      connection = await ctx.getBusinessConnection();
    } catch (err) {
      console.error(`${logPrefix} | ❌ fail=getBusinessConnection: ${err}`);
      return;
    }

    if (senderId === ctx.me.id) {
      console.log(`${logPrefix} | ⏩ skipped (sent by bot)`);
      return;
    }

    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      console.warn(`${logPrefix} | ❌ fail=userNotFound`);
      await ctx.reply('⛔️ Ошибка: пользователь не зарегистрирован.');
      return;
    }

    try {
      await saveGiftToDatabase({
        giftId: String(giftId),
        collectionName,
        number: giftNumber,
        model: {
          name: gift.model.name,
          rarity: gift.model.rarity_per_mille,
          emoji: gift.model.sticker.emoji,
        },
        pattern: {
          name: gift.symbol.name,
          rarity: gift.symbol.rarity_per_mille,
          emoji: gift.symbol.sticker.emoji,
        },
        backdrop: {
          name: gift.backdrop.name,
          rarity: gift.backdrop.rarity_per_mille,
          center_color: gift.backdrop.colors.center_color,
          edge_color: gift.backdrop.colors.edge_color,
          symbol_color: gift.backdrop.colors.symbol_color,
          text_color: gift.backdrop.colors.text_color,
        },
        owner: user,
      });

      console.log(`${logPrefix} | ✅ saved`);
    } catch (err) {
      console.error(`${logPrefix} | ❌ fail=saveError: ${err}`);
    }
  });
};
