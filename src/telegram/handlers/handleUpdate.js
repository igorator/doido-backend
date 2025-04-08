import { TELEGRAM_USER_ID } from '../config/telegramConfig.js';

export const handleUpdate = async (update) => {
  if (
    update._ === 'updateNewMessage' &&
    update.message?._ === 'message' &&
    update.message.content?._ === 'messageUpgradedGift'
  ) {
    const senderId = update.message.sender_id?.user_id;
    const chatId = update.message.chat_id;
    const isFromMe = senderId === TELEGRAM_USER_ID;

    if (isFromMe) {
      console.log(`📤 Я отправил улучшенный подарок пользователю: ${chatId}`);
    } else {
      console.log(
        `📥 Мне пришёл улучшенный подарок от пользователя: ${senderId}`,
      );

      console.log(JSON.stringify(update.message.content, null, 2));
    }
  }
};
