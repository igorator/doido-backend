import { TELEGRAM_USER_ID } from '../config/telegramConfig.js';
import { addGift } from '../../controllers/giftController/addGift.js';
import { userRepository } from '../../database/repositories/userRepository.js';
import { giftRepository } from '../../database/repositories/giftRepository.js';

export const handleUpdate = async (update) => {
  if (
    update._ === 'updateNewMessage' &&
    update.message?._ === 'message' &&
    update.message.content?._ === 'messageUpgradedGift'
  ) {
    const senderId = update.message.sender_id?.user_id;
    const chatId = update.message.chat_id;
    const isFromMe = senderId === TELEGRAM_USER_ID;
    const gift = update.message.content.gift;

    if (isFromMe) {
      console.log(`📤 Я отправил улучшенный подарок пользователю: ${chatId}`);

      try {
        const giftToDelete = await giftRepository.findOneBy({ id: gift.id });

        if (!giftToDelete) {
          console.warn(
            `⚠️ Подарок с id ${gift.id} не найден в базе для удаления`,
          );
          return;
        }

        await giftRepository.remove(giftToDelete);
        console.log(`🗑️ Подарок ${gift.id} успешно удалён после отправки`);
      } catch (err) {
        console.error('❌ Ошибка при удалении подарка:', err.message);
      }

      return;
    }

    console.log(
      `📥 Мне пришёл улучшенный подарок от пользователя: ${senderId}`,
    );

    console.log('🎁 Подарок:', gift);

    const user = await userRepository.findOneBy({ id: senderId });

    if (!user) {
      console.warn('⚠️ Пользователь не найден, подарок не сохранён');
      return;
    }

    try {
      await addGift(gift, user);
    } catch (err) {
      console.error('❌ Ошибка при сохранении подарка:', err.message);
    }
  }
};
