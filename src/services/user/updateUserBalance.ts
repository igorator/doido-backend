import Decimal from 'decimal.js';
import { AppDataSource } from '../../database/db';
import { User } from '../../models/User';

export async function plusUserBalance(userId: string, amount: Decimal): Promise<void> {
  if (!amount.isFinite() || amount.lte(0)) {
    throw new Error(`plusUserBalance: invalid amount ${amount.toString()}`);
  }

  const result = await AppDataSource.getRepository(User).increment(
    { id: userId },
    'ton_balance',
    amount.toNumber(),
  );

  if (!result.affected) {
    throw new Error(`plusUserBalance: user ${userId} not found`);
  }
}

export async function minusUserBalance(userId: string, amount: Decimal): Promise<void> {
  if (!amount.isFinite() || amount.lte(0)) {
    throw new Error(`minusUserBalance: invalid amount ${amount.toString()}`);
  }

  const result = await AppDataSource.getRepository(User)
    .createQueryBuilder()
    .update()
    .set({ ton_balance: () => `ton_balance - :amount` })
    .where('id = :id AND ton_balance >= :amount')
    .setParameters({ id: userId, amount: amount.toFixed(8) })
    .execute();

  if (!result.affected) {
    throw new Error('Insufficient balance');
  }
}
