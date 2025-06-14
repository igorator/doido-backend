import { bot } from '../../bot/bot';

export type ParseMode = 'HTML' | 'Markdown' | 'MarkdownV2' | undefined;

export const botSendMessage = async (
  chatId: number | string,
  message: string,
  parseMode?: ParseMode,
): Promise<void> => {
  chatId = Number(chatId);
  try {
    await bot.api.sendMessage(chatId, message, {
      parse_mode: parseMode,
    });
  } catch (error) {
    console.error(`❌ Ошибка при отправке сообщения в чат ${chatId}:`, error);
  }
};
