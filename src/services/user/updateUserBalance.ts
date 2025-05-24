import Decimal from 'decimal.js';
import { userRepository } from '../../database/repositories/userRepository';
import { getUserById } from './getUserById';

export async function plusUserBalance(userId: string, amount: Decimal) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  user.ton_balance = new Decimal(user.ton_balance).plus(amount);
  await userRepository.save(user);

  return user;
}

export async function minusUserBalance(userId: string, amount: Decimal) {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');

  user.ton_balance = new Decimal(user.ton_balance).minus(amount);
  if (user.ton_balance.lessThan(0)) {
    throw new Error('Insufficient balance');
  }

  await userRepository.save(user);
  return user;
}
