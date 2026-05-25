import { num } from './_helpers';

export const tonConfig = {
  depositWalletAddress: process.env.TON_DEPOSIT_WALLET_ADDRESS ?? '',
  depositSecretKey: process.env.TON_DEPOSIT_WALLET_SECRET_KEY ?? '',
  withdrawSecretKey: process.env.TON_WITHDRAW_WALLET_SECRET_KEY ?? '',
  toncenterEndpoint: process.env.TONCENTER_API_ENDPOINT ?? '',
  toncenterApiKey: process.env.TONCENTER_API_KEY,
  subwalletNumber: num(process.env.TON_SUBWALLET_NUMBER, 0),
  withdrawMaxBatchSize: num(process.env.TON_WITHDRAW_MAX_BATCH_SIZE, 20),
  withdrawIntervalMs: num(process.env.TON_WITHDRAW_INTERVAL_MS, 15_000),
  withdrawRefillAmount: num(process.env.TON_WITHDRAW_REFILL_AMOUNT, 50),
  depositWatcherIntervalMs: num(process.env.TON_DEPOSIT_WATCHER_INTERVAL_MS, 15_000),
} as const;
