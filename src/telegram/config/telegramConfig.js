import dotenv from 'dotenv';
dotenv.config();

export const TELEGRAM_API_ID = Number(process.env.TELEGRAM_API_ID);
export const TELEGRAM_API_HASH = process.env.TELEGRAM_API_HASH;
export const TELEGRAM_USER_ID = Number(process.env.TELEGRAM_USER_ID);

if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH || !TELEGRAM_USER_ID) {
  throw new Error('❌ Missing Telegram config in .env file');
}
