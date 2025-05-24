import { userRepository } from '../../database/repositories/userRepository';

export async function getUserById(userId: string) {
  return await userRepository.findOneBy({ id: userId });
}
