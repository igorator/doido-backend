import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { GIFT_TRANSFER_FEE } from '../../shared/constants';

const giftTransferFee = GIFT_TRANSFER_FEE;

export const getFees = (req: Request, res: Response): void => {
  res.json({
    gift_transfer_fee: new Decimal(giftTransferFee),
  });
};
