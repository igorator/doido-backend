import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { MARKET_PERCENT_FEE } from '../../shared/constants';

const FEE = new Decimal(MARKET_PERCENT_FEE);

function calculateSellerReceivesFromBuyerAmount(amount: Decimal): Decimal {
  return amount.div(FEE.add(1)).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}

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
