export const TELEGRAM_API_ID = Number(process.env.TELEGRAM_API_ID);
export const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH;

if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH) {
  throw new Error('❌ Missing Telegram config in .env file');
}
