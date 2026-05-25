import { Request, Response } from 'express';
import { depositTonService } from '../../services/ton/depositTonService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export async function depositTon(req: Request, res: Response): Promise<void> {
  const telegramUser = req.telegramUser;

  if (!telegramUser?.id) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { amountTon } = req.body;

  if (!amountTon) {
    res.status(400).json({ message: 'Deposit amount is required' });
    return;
  }

  const parsedAmount = Number(amountTon);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ message: 'Deposit amount must be a valid positive number' });
    return;
  }

  try {
    const transaction = await depositTonService(String(telegramUser.id), parsedAmount);
    res.json({ transaction });
  } catch (err) {
    handleHttpError(res, err, 'depositTon');
  }
}
