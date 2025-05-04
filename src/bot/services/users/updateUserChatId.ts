import { userRepository } from '../../../database/repositories/userRepository';

export const updateUserChatId = async (userId: string, chatId: string) => {
  await userRepository.update(userId, {
    chat_id: String(chatId),
  });
};
