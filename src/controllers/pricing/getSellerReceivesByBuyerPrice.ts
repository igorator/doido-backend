import { Request, Response } from 'express';
import { calculateSellerReceivesFromBuyerAmount } from '../../shared/lib/pricing';
import Decimal from 'decimal.js';

export const getSellerReceivesByBuyerPrice = (
  req: Request,
  res: Response,
): void => {
  const rawAmount = req.query.amount;

  try {
    const amount = new Decimal(rawAmount?.toString());

    if (amount.lte(0)) {
      throw new Error('Amount must be greater than zero');
    }

    const sellerReceives = calculateSellerReceivesFromBuyerAmount(amount);
    res.json({ sellerReceives: sellerReceives.toString() });
  } catch {
    res.status(400).json({ error: 'Invalid amount' });
  }
};
