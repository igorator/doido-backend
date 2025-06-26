import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import {
  MAX_SELL_PRICE,
  MIN_SELL_PRICE,
  MAX_FREE_GIFTS_LISTINGS,
} from '../../shared/constants';

export const getSellPriceLimits = (req: Request, res: Response): void => {
  res.json({
    min: new Decimal(MIN_SELL_PRICE),
    max: new Decimal(MAX_SELL_PRICE),
    max_free_listings: Number(MAX_FREE_GIFTS_LISTINGS),
  });
};
