import Decimal from 'decimal.js';
import { AppDataSource } from '../../database/db';
import { userRepository } from '../../database/repositories/userRepository';
import { WithdrawLog } from '../../models/ton/WithdrawLog';
import { createHttpError } from '../../shared/lib/httpError';
import { config } from '../../config';

const WITHDRAW_RATE_LIMIT_SECONDS = 30;
const WITHDRAW_RATE_LIMIT_MS = WITHDRAW_RATE_LIMIT_SECONDS * 1000;
const MIN_WITHDRAW = config.limits.minWithdraw;
const MAX_WITHDRAW = config.limits.maxWithdraw;

export async function withdrawTonService(
  userId: string,
  amountTon: number,
  to: string,
): Promise<number> {
  if (amountTon < MIN_WITHDRAW) {
    throw createHttpError(`Minimum withdrawal amount is ${MIN_WITHDRAW} TON`, 400);
  }

  if (amountTon > MAX_WITHDRAW) {
    throw createHttpError(`Maximum withdrawal amount is ${MAX_WITHDRAW} TON`, 400);
  }

  const withdrawId = await AppDataSource.transaction(async (manager) => {
    const user = await manager
      .getRepository(userRepository.target)
      .createQueryBuilder('user')
      .setLock('pessimistic_write')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw createHttpError('User not found', 404);
    }

    const now = Date.now();
    const lastWithdrawTime = Number(user.last_withdraw_time ?? 0);
    const timeSinceLast = now - lastWithdrawTime;

    if (timeSinceLast < WITHDRAW_RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil((WITHDRAW_RATE_LIMIT_MS - timeSinceLast) / 1000);
      throw createHttpError(
        `Withdraw allowed once per ${WITHDRAW_RATE_LIMIT_SECONDS}s. Wait ${waitSeconds}s.`,
        429,
      );
    }

    const balance = new Decimal(user.ton_balance);
    if (balance.lt(amountTon)) {
      throw createHttpError('Insufficient balance', 403);
    }

    user.ton_balance = balance.minus(amountTon);
    user.last_withdraw_time = now;
    await manager.save(user);

    const withdrawLog = manager.getRepository(WithdrawLog).create({
      userId,
      to,
      amount: amountTon.toString(),
      status: 'pending',
      wasDebited: true,
      createdAt: now,
    });

    await manager.save(withdrawLog);
    return withdrawLog.id;
  });

  return withdrawId;
}
