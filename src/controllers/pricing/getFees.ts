import { Request, Response } from 'express';
import Decimal from 'decimal.js';

const GIFT_TRANSFER_FEE = process.env.GIFT_TRANSFER_FEE;

export const getFees = (req: Request, res: Response): void => {
  res.json({
    gift_transfer_fee: new Decimal(GIFT_TRANSFER_FEE),
  });
};
