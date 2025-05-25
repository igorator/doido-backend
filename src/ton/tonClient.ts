import 'dotenv/config';
import { TonClient } from '@ton/ton';

if (!process.env.TONCENTER_API_ENDPOINT) {
  throw new Error('❌ TONCENTER_API_ENDPOINT is not defined');
}

export const tonClient = new TonClient({
  endpoint: process.env.TONCENTER_API_ENDPOINT,
  apiKey: process.env.TONCENTER_API_KEY,
});
