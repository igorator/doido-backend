import { Request, Response } from 'express';
import { calculateSellerReceivesFromBuyerAmount } from '../../shared/lib/pricing';

export const getSellerReceivesByBuyerPrice = (
  req: Request,
  res: Response,
): void => {
  const amount = Number(req.query.amount);

  if (!amount || isNaN(amount) || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount' });
    return;
  }

  const sellerReceives = calculateSellerReceivesFromBuyerAmount(amount);
  res.json({ sellerReceives });
};
