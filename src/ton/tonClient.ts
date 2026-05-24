import { TonClient } from '@ton/ton';
import { config } from '../config';

if (!config.ton.toncenterEndpoint) {
  throw new Error('❌ TONCENTER_API_ENDPOINT is not defined');
}

export const tonClient = new TonClient({
  endpoint: config.ton.toncenterEndpoint,
  apiKey: config.ton.toncenterApiKey,
  timeout: 20_000,
});
