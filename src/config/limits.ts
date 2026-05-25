import { num } from './_helpers';

export const limitsConfig = {
  minSellPrice: num(process.env.MIN_SELL_PRICE, 0.5),
  maxSellPrice: num(process.env.MAX_SELL_PRICE, 50_000),
  minWithdraw: num(process.env.MIN_WITHDRAW_AMOUNT, 0.1),
  maxWithdraw: num(process.env.MAX_WITHDRAW_AMOUNT, 50),
  minDeposit: num(process.env.MIN_DEPOSIT_AMOUNT, 0.1),
  maxFreeListings: num(process.env.MAX_FREE_LISTINGS, 5),
} as const;
