import { Bot, Context } from 'grammy';
import { userRepository } from '../../../database/repositories/userRepository';
import { saveGiftToDatabase } from '../../../services/gifts/saveGiftToDatabase';

export const onGiftRouter = (bot: Bot) => {
  bot.on('business_message', async (ctx: Context) => {
    const giftPayload = ctx.businessMessage?.unique_gift;

    if (!giftPayload) {
      console.warn('⚠️ businessMessage есть, но нет unique_gift');
      return;
    }

    const giftId = giftPayload.owned_gift_id;
    const gift = giftPayload.gift;

    if (!giftId || !gift) {
      console.warn('⚠️ Подарок не содержит giftId или gift');
      return;
    }

    console.log('📥 Получен подарок:', {
      giftId,
      giftName: gift.name,
      senderId: ctx.from?.id,
      chatId: ctx.chat?.id,
      origin: giftPayload.origin,
    });

    let connection;
    try {
      connection = await ctx.getBusinessConnection();
      console.log('✅ Business connection получен:', {
        botUserId: ctx.me.id,
        connectionUserId: connection.user.id,
      });
    } catch (err) {
      console.error('❌ Не удалось получить business connection:', err);
      return;
    }

    const senderId = ctx.from?.id;
    const botUserId = ctx.me.id;

    console.log('🔍 Сравнение ID:', {
      senderId,
      botUserId,
      isFromBot: senderId === botUserId,
    });

    if (senderId === botUserId) {
      console.log(`📤 Подарок ${giftId} отправлен ботом — пропуск сохранения.`);
      return;
    }

    const userId = String(senderId);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      console.warn(`❌ Пользователь ${userId} не найден в БД`);
      await ctx.reply('⛔️ Ошибка: пользователь не зарегистрирован.');
      return;
    }

    try {
      await saveGiftToDatabase({
        giftId: String(giftId),
        collectionName: gift.base_name,
        number: gift.number,
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

      console.log(`🎁 Подарок ${gift.base_name} сохранён (gift_id=${giftId})`);
    } catch (err) {
      console.error(`❌ Ошибка при сохранении подарка ${giftId}:`, err);
    }
  });
};
