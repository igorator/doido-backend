import { bot } from '../../bot/bot';

export type ParseMode = 'HTML' | 'Markdown' | 'MarkdownV2' | undefined;

export const botSendMessage = async (
  chatId: number | string,
  message: string,
  parseMode?: ParseMode,
): Promise<void> => {
  const numericChatId = Number(chatId);
  try {
    await bot.api.sendMessage(numericChatId, message, {
      parse_mode: parseMode,
    });
  } catch (error) {
    console.error(`❌ Error sending message to chat ${numericChatId}:`, error);
  }
};
