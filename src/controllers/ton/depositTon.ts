import { Request, Response } from 'express';

export async function depositTon(req: Request, res: Response) {
  const { userId, amountTon } = req.body;

  if (!userId || !amountTon || amountTon <= 0) {
    res.status(400).json({ message: 'Invalid request' });
    return;
  }

  const comment = `deposit:${userId}:${Date.now()}`;

  res.status(200).json({
    to: process.env.TON_MARKET_WALLET!,
    amountNano: String(Math.floor(amountTon * 1e9)),
    comment,
  });
}
