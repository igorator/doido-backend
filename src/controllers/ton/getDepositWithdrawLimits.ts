import { Request, Response } from 'express';
import Decimal from 'decimal.js';

const MIN_WITHDRAW_AMOUNT = new Decimal(process.env.MIN_WITHDRAW_AMOUNT);
const MAX_WITHDRAW_AMOUNT = new Decimal(process.env.MAX_WITHDRAW_AMOUNT);
const MIN_DEPOSIT_AMOUNT = new Decimal(process.env.MIN_DEPOSIT_AMOUNT);

export const getDepositWithdrawLimits = (req: Request, res: Response): void => {
  res.json({
    min_withdraw: MIN_WITHDRAW_AMOUNT,
    max_withdraw: MAX_WITHDRAW_AMOUNT,
    min_deposit: MIN_DEPOSIT_AMOUNT,
  });
};
