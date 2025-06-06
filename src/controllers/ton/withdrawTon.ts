import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { getUserById } from '../../services/user/getUserById';
import { minusUserBalance } from '../../services/user/updateUserBalance';
import { WithdrawLog } from '../../models/ton/WithdrawLog';
import { AppDataSource } from '../../database/db';

const withdrawLogRepository = AppDataSource.getRepository(WithdrawLog);

export async function withdrawTon(req: Request, res: Response) {
  try {
    const { userId, amountTon, to } = req.body;

    if (!userId || !to || typeof amountTon !== 'number' || amountTon <= 0) {
      return res.status(400).json({ message: 'Invalid withdraw request' });
    }

    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (new Decimal(user.ton_balance).lt(amountTon)) {
      return res.status(403).json({ message: 'Insufficient balance' });
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
