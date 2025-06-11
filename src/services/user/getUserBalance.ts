import { userRepository } from '../../database/repositories/userRepository';
import Decimal from 'decimal.js';

export async function getUserBalance(userId: string): Promise<Decimal> {
  const user = await userRepository.findOne({
    where: { id: userId },
    select: ['ton_balance'],
  });

  if (!user) {
    throw new Error(`User with id ${userId} not found`);
  }

  return new Decimal(user.ton_balance);
}
