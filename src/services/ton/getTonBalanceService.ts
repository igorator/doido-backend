import axios from 'axios';

const TONCENTER_API_ENDPOINT = process.env.TONCENTER_API_ENDPOINT!;
const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY!;

/**
 * Получить баланс TON-кошелька.
 * @param address - адрес TON кошелька
 * @returns баланс в TON (number)
 */
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

  // Вернуть в TON, а не в nanoTON
  return Number(data.result) / 1e9;
}
