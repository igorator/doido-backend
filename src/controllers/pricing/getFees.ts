import { Request, Response } from 'express';
import { GIFT_TRANSFER_FEE } from '../../shared/constants';

export const getFees = (_req: Request, res: Response): void => {
  res.json({
    gift_transfer_fee: GIFT_TRANSFER_FEE,
  });
};
