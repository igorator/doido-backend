import { Request, Response } from 'express';
import { calculateBuyerPaysFromSellerAmount } from '../../shared/lib/pricing';

export const getBuyerPaysBySellerPrice = (req: Request, res: Response) => {
  const amount = Number(req.query.amount);

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const buyerPays = calculateBuyerPaysFromSellerAmount(amount);
  return res.json({ buyerPays });
};
