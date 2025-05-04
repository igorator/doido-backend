import { Bot, Context } from 'grammy';
import { saveGiftToDatabase } from '../../services/gifts/saveGiftToDatabase';
import { updateUserChatId } from '../../services/users/updateUserChatId';
import { userRepository } from '../../../database/repositories/userRepository';
import { setBusinessConnectionId } from '../../shared/businessConnectionId';

export const onGiftReceived = (bot: Bot) => {
  bot.on('business_message', async (ctx: Context) => {
    console.log('📥 Получено business_message');

    const message = ctx.businessMessage;
    if (!message) {
      console.warn('⚠️ Нет businessMessage');
      return;
    }

    if (!message.unique_gift) {
      console.warn('⚠️ Нет unique_gift в сообщении');
      return;
    }

    if (!ctx.from) {
      console.warn('⚠️ Нет ctx.from');
      return;
    }

    console.log('✅ Проверка на отправителя и подарок пройдена');

    let connection;
    try {
      connection = await ctx.getBusinessConnection();
      console.log('🔗 Получен business connection:', connection.id);
    } catch (err) {
      console.error('❌ Ошибка при получении business connection:', err);
      return;
    }

    const employee = connection.user;

    if (ctx.from.id === employee.id) {
      console.log('ℹ️ Сообщение от самого бота. Игнорируем.');
      return;
    }

    const userId = String(ctx.from.id);
    console.log('👤 ID пользователя:', userId);

    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      console.warn(`❌ Пользователь ${userId} не найден в БД`);
      await ctx.reply('⛔️ Ошибка: пользователь не зарегистрирован.');
      return;
    }

    const chatId = String(ctx.chat.id);
    console.log(`💬 Chat ID: ${chatId}`);

    try {
      await updateUserChatId(userId, chatId);
      console.log('📌 Chat ID пользователя обновлён');
    } catch (err) {
      console.error('❌ Ошибка при обновлении chat_id:', err);
    }

    try {
      setBusinessConnectionId(connection.id);
      console.log('🗂 Business connection ID установлен глобально');
    } catch (err) {
      console.error('❌ Ошибка при установке businessConnectionId:', err);
    }

    const giftPayload = message.unique_gift;
    const gift = giftPayload.gift;

    try {
      await saveGiftToDatabase({
        giftId: String(giftPayload.owned_gift_id),
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

      console.log(
        `🎁 Подарок ${gift.base_name} успешно сохранён (gift_id=${giftPayload.owned_gift_id})`,
      );
    } catch (err) {
      console.error(
        `❌ Ошибка при сохранении подарка ${giftPayload.owned_gift_id}:`,
        err,
      );
    }
  });
};
