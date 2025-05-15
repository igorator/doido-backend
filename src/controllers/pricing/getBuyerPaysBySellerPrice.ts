import { Request, Response } from 'express';
import { calculateBuyerPaysFromSellerAmount } from '../../shared/lib/pricing';

export const getBuyerPaysBySellerPrice = (
  req: Request,
  res: Response,
): void => {
  const amount = Number(req.query.amount);

  if (!amount || isNaN(amount) || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount' });
    return;
  }

  const buyerPays = calculateBuyerPaysFromSellerAmount(amount);
  res.json({ buyerPays });
};
