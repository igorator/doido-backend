import { Request, Response } from 'express';

export async function depositTon(req: Request, res: Response) {
  try {
    const { userId, amountTon } = req.body;

    if (!userId || typeof amountTon !== 'number' || amountTon <= 0) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const to = process.env.TON_DEPOSIT_WALLET;
    if (!to) {
      return res.status(500).json({ message: 'Deposit wallet not configured' });
    }

    const comment = `deposit:${userId}:${Date.now()}`;
    const amountNano = Math.floor(amountTon * 1e9);

    return res.json({
      to,
      amountNano: amountNano.toString(),
      comment,
    });
  } catch (err) {
    console.error('❌ depositTon error:', err);
    return res.status(500).json({ message: 'Internal error' });
  }
}
