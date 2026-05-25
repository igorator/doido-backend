import { userRepository } from '../../database/repositories/userRepository';
import { User } from '../../models/User';

export interface AuthUserInput {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  photo_url?: string;
  allows_write_to_pm?: boolean;
}

export async function authUserService(input: AuthUserInput): Promise<User> {
  const userId = String(input.id);

  await userRepository.upsert(
    {
      id: userId,
      username: input.username || 'hidden',
      first_name: input.first_name,
      last_name: input.last_name,
      language_code: input.language_code,
      photo_url: input.photo_url,
      allows_write_to_pm: input.allows_write_to_pm,
    },
    {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true,
    },
  );

  const user = await userRepository.findOne({
    where: { id: userId },
    relations: ['referred_by', 'referred_users'],
  });

  if (!user) {
    throw new Error('User not found after upsert');
  }

  return user;
}
