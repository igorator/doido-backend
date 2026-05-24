import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { Address } from '@ton/core';
import { AppDataSource } from '../../database/db';
import { userRepository } from '../../database/repositories/userRepository';
import { WithdrawLog } from '../../models/ton/WithdrawLog';

const withdrawLogRepository = AppDataSource.getRepository(WithdrawLog);

const WITHDRAW_RATE_LIMIT_SECONDS = 30;
const WITHDRAW_RATE_LIMIT_MS = WITHDRAW_RATE_LIMIT_SECONDS * 1000;

export async function withdrawTon(req: Request, res: Response) {
  const body = req.body ?? {};
  const amountTon = body.amountTon;
  const to = body.to;
  const telegramUser = (req as any).telegramUser;

  if (
    !telegramUser?.id ||
    typeof to !== 'string' ||
    !to.trim() ||
    typeof amountTon !== 'number' ||
    isNaN(amountTon) ||
    amountTon <= 0
  ) {
    res.status(400).json({ message: 'Invalid withdraw request' });
    return;
  }

  try {
    Address.parse(to);
  } catch {
    res.status(400).json({ message: 'Invalid TON address' });
    return;
  }

  const userId = String(telegramUser.id);

  try {
    await AppDataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(userRepository.target)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :userId', { userId })
        .getOne();

      if (!user) throw { code: 404, message: 'User not found' };

      const now = Date.now();
      const last = Number(user.last_withdraw_time ?? 0);
      const timeSinceLast = now - last;

      if (timeSinceLast < WITHDRAW_RATE_LIMIT_MS) {
        throw {
          code: 429,
          message: `Withdraw allowed only once per ${WITHDRAW_RATE_LIMIT_SECONDS} seconds. Please wait ${Math.ceil(
            (WITHDRAW_RATE_LIMIT_MS - timeSinceLast) / 1000,
          )}s.`,
        };
      }

      const balance = new Decimal(user.ton_balance);
      if (balance.lt(amountTon)) {
        throw { code: 403, message: 'Insufficient balance' };
      }

      user.ton_balance = balance.minus(amountTon);
      user.last_withdraw_time = now;
      await manager.save(user);

      const withdrawLog = withdrawLogRepository.create({
        userId,
        to,
        amount: amountTon.toString(),
        status: 'pending',
        wasDebited: true,
        createdAt: now,
      });

      await manager.save(withdrawLog);
      res.json({ success: true, withdrawId: withdrawLog.id });
    });
  } catch (err: any) {
    if (err?.code === 403 || err?.code === 404 || err?.code === 429) {
      res.status(err.code).json({ message: err.message });
    } else {
      console.error('❌ withdrawTonRequest error:', err);
      res.status(500).json({ message: 'Internal error' });
    }
  }
}
