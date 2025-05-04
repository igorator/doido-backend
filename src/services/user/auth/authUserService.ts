import { userRepository } from '../../../database/repositories/userRepository';

export async function authTelegramUser(telegramUser) {
  const userData = {
    ...telegramUser,
    id: String(telegramUser.id),
  };

  await userRepository.upsert(userData, ['id']);
  const user = await userRepository.findOneBy({ id: userData.id });

  if (!user) throw new Error('Failed to retrieve user after upsert');
  return user;
}
