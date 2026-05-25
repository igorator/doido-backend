import { Request, Response } from 'express';
import { MAX_SELL_PRICE, MIN_SELL_PRICE, MAX_FREE_GIFTS_LISTINGS } from '../../shared/constants';

export const getSellPriceLimits = (_req: Request, res: Response): void => {
  res.json({
    min: MIN_SELL_PRICE,
    max: MAX_SELL_PRICE,
    max_free_listings: Number(MAX_FREE_GIFTS_LISTINGS),
  });
};
