import { Request, Response } from 'express';
import { MAX_SELL_PRICE, MIN_SELL_PRICE } from '../../shared/config/pricing';

export const getSellPriceLimits = (req: Request, res: Response) => {
  return res.json({
    min: MIN_SELL_PRICE,
    max: MAX_SELL_PRICE,
  });
};
