import { Request, Response } from 'express';
import { calculateSellerReceivesFromBuyerAmount } from '../../shared/lib/pricing';

export const getSellerReceivesByBuyerPrice = (req: Request, res: Response) => {
  const amount = Number(req.query.amount);

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const sellerReceives = calculateSellerReceivesFromBuyerAmount(amount);
  return res.json({ sellerReceives });
};
