import axios from 'axios';
import { config } from '../../config';

const TONCENTER_API_ENDPOINT = config.ton.toncenterEndpoint;
const TONCENTER_API_KEY = config.ton.toncenterApiKey;

export async function getTonBalanceService(address: string): Promise<number> {
  const { data } = await axios.post(
    TONCENTER_API_ENDPOINT,
    {
      id: 1,
      method: 'getAddressBalance',
      params: { address },
    },
    { headers: { 'X-API-Key': TONCENTER_API_KEY } },
  );

  if (!data?.result) throw new Error('No result from toncenter');

  return Number(data.result) / 1e9;
}
