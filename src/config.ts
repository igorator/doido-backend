/**
 * Application configuration — single source of truth.
 *
 * Reads all environment variables here and exports a typed `config` object.
 * No other file should read `process.env` directly.
 *
 * Loaded once at module evaluation time via dotenv.
 */
import dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

function num(val: string | undefined, def: number): number {
  if (val === undefined || val === '') return def;
  const n = Number(val);
  return isNaN(n) ? def : n;
}

const _marketFee = num(process.env.DEFAULT_FEE, 0.01);

export const config = {
  // ─── Server ────────────────────────────────────────────────────────────────
  server: {
    port: num(process.env.PORT ?? process.env.SERVER_PORT, 8080),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    isProd: process.env.NODE_ENV === 'production',
    isDev: process.env.NODE_ENV === 'development',
  },

  // ─── Telegram / Bot ────────────────────────────────────────────────────────
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    webhookUrl: process.env.BOT_WEBHOOK_URL ?? 'https://api.doido-market.com',
    channelUrl: process.env.TELEGRAM_CHANNEL_URL ?? 'https://t.me/doido_ann',
    businessConnectionId:
      process.env.TELEGRAM_BUSINESS_CONNECTION_ID ?? null,
    starsDepositerId: num(process.env.TELEGRAM_STARS_DEPOSITER_ID, 0),
    minStarsThreshold: num(process.env.TELEGRAM_MIN_STARS_THRESHOLD, 0),
  },

  // ─── PostgreSQL ────────────────────────────────────────────────────────────
  postgres: {
    host: process.env.POSTGRES_HOST ?? '',
    port: num(process.env.POSTGRES_PORT, 5432),
    user: process.env.POSTGRES_USER ?? '',
    password: process.env.POSTGRES_PASSWORD ?? '',
    database: process.env.POSTGRES_DB ?? '',
  },

  // ─── TON / TonCenter ──────────────────────────────────────────────────────
  ton: {
    depositWalletAddress: process.env.TON_DEPOSIT_WALLET_ADDRESS ?? '',
    depositSecretKey: process.env.TON_DEPOSIT_WALLET_SECRET_KEY ?? '',
    withdrawSecretKey: process.env.TON_WITHDRAW_WALLET_SECRET_KEY ?? '',
    toncenterEndpoint: process.env.TONCENTER_API_ENDPOINT ?? '',
    toncenterApiKey: process.env.TONCENTER_API_KEY,
    subwalletNumber: num(process.env.TON_SUBWALLET_NUMBER, 0),
    withdrawMaxBatchSize: num(process.env.TON_WITHDRAW_MAX_BATCH_SIZE, 20),
    withdrawIntervalMs: num(process.env.TON_WITHDRAW_INTERVAL_MS, 15_000),
    withdrawRefillAmount: num(process.env.TON_WITHDRAW_REFILL_AMOUNT, 50),
    depositWatcherIntervalMs: num(
      process.env.TON_DEPOSIT_WATCHER_INTERVAL_MS,
      15_000,
    ),
  },

  // ─── Fees (fractions: 0.01 = 1%) ──────────────────────────────────────────
  fees: {
    /** Market commission applied on top of sell price (default 1%) */
    marketPercent: _marketFee,
    /** Share of commission paid to referrer (default 20%) */
    referralPercent: num(process.env.REFERRAL_FEE, 0.2),
    /** Share paid to influencer referrer (default 1%) */
    influencerReferralPercent: num(
      process.env.INFLUENCER_REFERRAL_PERCENT_FEE,
      0.01,
    ),
    /** Flat fee in TON for listing a gift after free quota (default 0.1) */
    giftListing: num(process.env.GIFT_LISTING_FEE, 0.1),
    /** Flat fee in TON for transferring a gift (default 0.1) */
    giftTransfer: num(process.env.GIFT_TRANSFER_FEE, 0.1),
    /** Sell-side fee — defaults to marketPercent */
    sell: num(process.env.SELL_FEE, _marketFee),
  },

  // ─── Limits ────────────────────────────────────────────────────────────────
  limits: {
    /** Minimum sell price in TON */
    minSellPrice: num(process.env.MIN_SELL_PRICE, 0.5),
    /** Maximum sell price in TON */
    maxSellPrice: num(process.env.MAX_SELL_PRICE, 50_000),
    /** Minimum withdrawal amount in TON */
    minWithdraw: num(process.env.MIN_WITHDRAW_AMOUNT, 0.1),
    /** Maximum withdrawal amount in TON */
    maxWithdraw: num(process.env.MAX_WITHDRAW_AMOUNT, 50),
    /** Minimum deposit amount in TON */
    minDeposit: num(process.env.MIN_DEPOSIT_AMOUNT, 0.1),
    /** Free listing quota per gift before flat fee kicks in */
    maxFreeListings: num(process.env.MAX_FREE_LISTINGS, 5),
  },

  // ─── Telegram Stars ────────────────────────────────────────────────────────
  stars: {
    /** Stars balance threshold that triggers a low-balance alert */
    maxThreshold: 1000,
    /** Stars transferred per gift transfer operation */
    transferCount: 25,
  },

  // ─── Scheduled jobs ────────────────────────────────────────────────────────
  cron: {
    /** Cron expression for resetting weekly market volumes (default: Monday 00:00) */
    resetWeeklyMarket:
      process.env.RESET_WEEKLY_MARKET_CRON ?? '0 0 * * 1',
  },
} as const;
