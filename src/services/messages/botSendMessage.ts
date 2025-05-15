import { bot } from '../../bot/bot';

export const botSendMessage = async (
  chatId: number | string,
  message: string,
): Promise<void> => {
  chatId = Number(chatId);
  try {
    await bot.api.sendMessage(Number(chatId), message);
    console.log(`📩 Сообщение отправлено в чат ${chatId}`);
  } catch (error) {
    console.error(`❌ Ошибка при отправке сообщения в чат ${chatId}:`, error);
  }
};
