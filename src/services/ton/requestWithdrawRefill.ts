import { beginCell, toNano, Address } from '@ton/core';
import { sign } from '@ton/crypto';
import axios from 'axios';

const TONCENTER_API_ENDPOINT = process.env.TONCENTER_API_ENDPOINT!;
const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY!;
const DEPOSIT_SECRET_KEY = Buffer.from(
  process.env.TON_WALLET_SECRET_KEY!,
  'hex',
);

console.log(DEPOSIT_SECRET_KEY);

const DEPOSIT_WALLET_ADDRESS = process.env.TON_DEPOSIT_WALLET!;
const DEPOSIT_SUBWALLET_NUMBER = Number(
  process.env.TON_DEPOSIT_SUBWALLET_NUMBER || 0,
);

/**
 * Запросить рефил с депозитного кошелька на withdraw-кошелек.
 * @param toAddress - адрес назначения
 * @param amountTon - сумма в TON (строка или число)
 */
export async function requestWithdrawRefill(
  toAddress: string,
  amountTon: string | number,
) {
  // 1. Получаем seqno депозитного кошелька
  const seqno = await getSeqno(
    DEPOSIT_WALLET_ADDRESS,
    TONCENTER_API_ENDPOINT,
    TONCENTER_API_KEY,
  );

  const valid_until = Math.floor(Date.now() / 1000) + 600;

  // 2. Собираем OutList (один перевод)
  const msg = beginCell()
    .storeUint(0x10, 6) // int_msg_info$0
    .storeAddress(Address.parse(toAddress))
    .storeCoins(toNano(amountTon.toString()))
    .storeRef(beginCell().endCell()) // body (empty)
    .endCell();

  const action = beginCell()
    .storeUint(0x0ec3c86d, 32) // action_send_msg
    .storeUint(1, 8) // mode=1
    .storeRef(beginCell().endCell()) // prev (empty)
    .storeRef(msg)
    .endCell();

  // 3. Body для подписи
  const bodyUnsigned = beginCell()
    .storeUint(0x7369676e, 32) // prefix signed_external
    .storeUint(DEPOSIT_SUBWALLET_NUMBER, 32)
    .storeUint(valid_until, 32)
    .storeUint(seqno, 32)
    .storeRef(action)
    .storeBit(0)
    .endCell();

  // 4. Подпись
  const hash = bodyUnsigned.hash();
  const signature = sign(hash, DEPOSIT_SECRET_KEY);

  // 5. Финальное тело
  const body = beginCell()
    .storeUint(0x7369676e, 32)
    .storeUint(DEPOSIT_SUBWALLET_NUMBER, 32)
    .storeUint(valid_until, 32)
    .storeUint(seqno, 32)
    .storeRef(action)
    .storeBit(0)
    .storeBuffer(signature, 64)
    .endCell();

  const boc = body.toBoc({ idx: false }).toString('base64');

  // 6. Отправка через toncenter
  const { data } = await axios.post(
    TONCENTER_API_ENDPOINT,
    {
      id: 1,
      method: 'sendBoc',
      params: { boc },
    },
    { headers: { 'X-API-Key': TONCENTER_API_KEY } },
  );

  if (data.error) throw new Error(data.error.message || 'sendBoc error');
}

/**
 * Получить seqno кошелька (тот же helper, что в withdraw)
 */
async function getSeqno(address: string, endpoint: string, apiKey: string) {
  const { data } = await axios.post(
    endpoint,
    {
      id: 1,
      method: 'runGetMethod',
      params: {
        address,
        method: 'seqno',
        stack: [],
      },
    },
    { headers: { 'X-API-Key': apiKey } },
  );

  if (
    !data.result ||
    !data.result.stack ||
    !data.result.stack[0] ||
    !data.result.stack[0].value
  )
    throw new Error('seqno not found in toncenter response');

  return Number(data.result.stack[0].value);
}
