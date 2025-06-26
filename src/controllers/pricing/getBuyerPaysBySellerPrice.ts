import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { MARKET_PERCENT_FEE } from '../../shared/constants';

const FEE = new Decimal(MARKET_PERCENT_FEE);

function calculateBuyerPaysFromSellerAmount(amount: Decimal): Decimal {
  return amount.mul(FEE.add(1)).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}

export const getBuyerPaysBySellerPrice = (
  req: Request,
  res: Response,
): void => {
  const rawAmount = req.query.amount;

  try {
    const amount = new Decimal(rawAmount?.toString());

    if (amount.lte(0)) {
      throw new Error('Amount must be greater than zero');
    }

    const buyerPays = calculateBuyerPaysFromSellerAmount(amount);
    res.json({ buyerPays });
  } catch {
    res.status(400).json({ error: 'Invalid amount' });
  }
};
