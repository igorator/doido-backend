import { Request, Response } from 'express';
import Decimal from 'decimal.js';

const MAX_SELL_PRICE = new Decimal(process.env.MAX_SELL_PRICE);
const MIN_SELL_PRICE = new Decimal(process.env.MIN_SELL_PRICE);
const MAX_FREE_LISTINGS = Number(process.env.MAX_FREE_LISTINGS);

export const getSellPriceLimits = (req: Request, res: Response): void => {
  res.json({
    min: MIN_SELL_PRICE,
    max: MAX_SELL_PRICE,
    max_free_listings: MAX_FREE_LISTINGS,
  });
};
