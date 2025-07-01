import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { getUserById } from '../../services/user/getUserById';
import { minusUserBalance } from '../../services/user/updateUserBalance';
import { WithdrawLog } from '../../models/ton/WithdrawLog';
import { AppDataSource } from '../../database/db';

const withdrawLogRepository = AppDataSource.getRepository(WithdrawLog);

export async function withdrawTon(req: Request, res: Response) {
  try {
    const { amountTon, to } = req.body;
    const telegramUser = (req as any).telegramUser;

    if (
      !telegramUser?.id ||
      !to ||
      typeof amountTon !== 'number' ||
      amountTon <= 0
    ) {
      res.status(400).json({ message: 'Invalid withdraw request' });
      return;
    }

    const userId = String(telegramUser.id);
    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (new Decimal(user.ton_balance).lt(amountTon)) {
      res.status(403).json({ message: 'Insufficient balance' });
      return;
    }

    await minusUserBalance(userId, new Decimal(amountTon));

    const withdrawLog = await withdrawLogRepository.save({
      userId,
      to,
      amount: amountTon.toString(),
      status: 'pending',
      createdAt: Date.now(),
    });

    res.json({ success: true, withdrawId: withdrawLog.id });
  } catch (err) {
    console.error('❌ withdrawTonRequest error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
}
