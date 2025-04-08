import dotenv from 'dotenv';
import { createClient, configure } from 'tdl';
import { getTdjson } from 'prebuilt-tdlib';
import { TELEGRAM_API_HASH, TELEGRAM_API_ID } from './config/telegramConfig';

dotenv.config();

configure({ tdjson: getTdjson() });

const apiId = TELEGRAM_API_ID;
const apiHash = TELEGRAM_API_HASH;

if (!apiId || !apiHash) {
  throw new Error('❌ Missing Telegram config in .env file');
}

export const client = createClient({
  apiId,
  apiHash,
});

export const login = async () => {
  await client.login();
};
