import { TonClient } from '@ton/ton';

export const tonClient = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
});
