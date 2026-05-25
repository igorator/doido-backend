export const cronConfig = {
  resetWeeklyMarket: process.env.RESET_WEEKLY_MARKET_CRON ?? '0 0 * * 1',
} as const;
