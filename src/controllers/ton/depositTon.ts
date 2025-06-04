import { Request, Response } from 'express';

export async function depositTon(req: Request, res: Response) {
  try {
    const { userId, amountTon } = req.body;

    const minAmount = Number(process.env.MIN_DEPOSIT_AMOUNT ?? '0');

    if (!userId || typeof amountTon !== 'number' || amountTon <= 0) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const to = process.env.TON_DEPOSIT_WALLET;
    if (!to) {
      return res.status(500).json({ message: 'Deposit wallet not configured' });
    }

    if (amountTon < minAmount) {
      return res
        .status(400)
        .json({ message: 'Amount less than min deposit limit' });
    }

    // payload как base64
    const payloadText = `deposit:${userId}:${Date.now()}`;
    const payload = Buffer.from(payloadText).toString('base64');
    const amountNano = Math.floor(amountTon * 1e9);

    res.json({
      to,
      amountNano: amountNano.toString(),
      payload,
    });
  } catch (err) {
    console.error('❌ depositTon error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
}
