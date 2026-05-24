import { Request, Response } from 'express';
import { config } from '../../config';

export const getDepositWithdrawLimits = (_req: Request, res: Response): void => {
  res.json({
    min_withdraw: config.limits.minWithdraw,
    max_withdraw: config.limits.maxWithdraw,
    min_deposit: config.limits.minDeposit,
  });
};
