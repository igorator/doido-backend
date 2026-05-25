import { num } from './_helpers';

export const telegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  webhookUrl: process.env.BOT_WEBHOOK_URL ?? 'https://api.doido-market.com',
  channelUrl: process.env.TELEGRAM_CHANNEL_URL ?? 'https://t.me/doido_ann',
  businessConnectionId: process.env.TELEGRAM_BUSINESS_CONNECTION_ID ?? null,
  starsDepositerId: num(process.env.TELEGRAM_STARS_DEPOSITER_ID, 0),
  minStarsThreshold: num(process.env.TELEGRAM_MIN_STARS_THRESHOLD, 0),
} as const;
