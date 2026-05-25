import { Request, Response } from 'express';
import { Address } from '@ton/core';
import { withdrawTonService } from '../../services/ton/withdrawTonService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export async function withdrawTon(req: Request, res: Response): Promise<void> {
  const body = req.body ?? {};
  const amountTon = body.amountTon;
  const to = body.to;
  const telegramUser = req.telegramUser;

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

  try {
    const withdrawId = await withdrawTonService(String(telegramUser.id), amountTon, to);
    res.json({ success: true, withdrawId });
  } catch (err) {
    handleHttpError(res, err, 'withdrawTon');
  }
}
