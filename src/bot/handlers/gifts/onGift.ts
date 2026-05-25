import { Bot, Context } from 'grammy';
import { userRepository } from '../../../database/repositories/userRepository';
import { saveGiftToDatabase } from '../../../services/gifts/saveGiftToDatabase';
import { config } from '../../../config';

const BUSINESS_CONNECTION_ID = config.telegram.businessConnectionId;

export const onGiftRouter = (bot: Bot) => {
  bot.on('business_message', async (ctx: Context) => {
    const senderId = ctx.from?.id;
    const botId = ctx.me.id;

    if (senderId === botId) return;
    if (ctx.businessMessage?.from?.id === botId) return;

    const giftPayload = ctx.businessMessage?.unique_gift;
    if (!giftPayload) return;

    const giftId = giftPayload.owned_gift_id || ctx.businessMessage.message_id;
    const gift = giftPayload.gift;
    const userId = String(senderId);
    const collectionName = gift.base_name;
    const giftNumber = gift.number;
    const username = ctx.from?.username ? `@${ctx.from.username}` : 'unknown';

    if (!giftId || !giftPayload) return;

    const logPrefix = `🎁 GIFT IN | id=${giftId} | collection="${collectionName}" | number=${giftNumber} | from=${userId} (${username})`;

    let connection;
    try {
      connection = await ctx.getBusinessConnection();
    } catch (err) {
      console.error(`${logPrefix} | ❌ fail=getBusinessConnection: ${err}`);
      return;
    }

    if (connection.id !== BUSINESS_CONNECTION_ID) {
      console.warn(`${logPrefix} | ❌ unexpected connection_id=${connection.id}`);
      return;
    }

    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      if (userId === String(botId)) {
        console.warn(`${logPrefix} | 🔁 Skipped: duplicate delivery event from bot`);
        return;
      }

      console.warn(`${logPrefix} | ❌ fail=userNotFound`);
      return;
    }

    try {
      await saveGiftToDatabase({
        giftId: String(giftId),
        collectionName,
        number: giftNumber,
        model: {
          name: gift.model.name,
          rarity: gift.model.rarity_per_mille / 10,
          emoji: gift.model.sticker.emoji ?? '',
        },
        pattern: {
          name: gift.symbol.name,
          rarity: gift.symbol.rarity_per_mille / 10,
          emoji: gift.symbol.sticker.emoji ?? '',
        },
        backdrop: {
          name: gift.backdrop.name,
          rarity: gift.backdrop.rarity_per_mille / 10,
          center_color: `#${gift.backdrop.colors.center_color.toString(16).padStart(6, '0')}`,
          edge_color: `#${gift.backdrop.colors.edge_color.toString(16).padStart(6, '0')}`,
          symbol_color: `#${gift.backdrop.colors.symbol_color.toString(16).padStart(6, '0')}`,
          text_color: `#${gift.backdrop.colors.text_color.toString(16).padStart(6, '0')}`,
        },
        owner: user,
      });

      console.log(`${logPrefix} | ✅ saved | connection_id=${connection.id}`);
    } catch (err) {
      console.error(`${logPrefix} | ❌ fail=saveError: ${err}`);
    }
  });
};
