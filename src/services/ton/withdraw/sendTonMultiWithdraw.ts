import { beginCell, Cell, Address, toNano } from '@ton/core';
import { sign } from '@ton/crypto';
import axios from 'axios';

// recipients = [{to: string, amount: string}]
export async function sendTonMultiWithdraw(
  recipients: { to: string; amount: string }[],
) {
  const TONCENTER_API_ENDPOINT = process.env.TONCENTER_API_ENDPOINT!;
  const TONCENTER_API_KEY = process.env.TONCENTER_API_KEY!;
  const WALLET_ADDRESS = process.env.TON_WITHDRAW_WALLET!;
  const WALLET_ID = Number(process.env.TON_WITHDRAW_SUBWALLET_NUMBER!);
  const SECRET_KEY = Buffer.from(process.env.TON_WALLET_SECRET_KEY!, 'hex');

  // 1. Получи seqno
  const seqno = await getSeqno(
    WALLET_ADDRESS,
    TONCENTER_API_ENDPOINT,
    TONCENTER_API_KEY,
  );

  // 2. valid_until (+10 мин)
  const valid_until = Math.floor(Date.now() / 1000) + 600;

  // 3. Собрать OutList (TON TLB OutActionList, reverse order)
  let prev = Cell.EMPTY;
  for (let i = recipients.length - 1; i >= 0; i--) {
    const { to, amount } = recipients[i];
    const msg = beginCell()
      .storeUint(0x10, 6) // int_msg_info$0
      .storeAddress(Address.parse(to))
      .storeCoins(toNano(amount))
      .storeRef(beginCell().endCell()) // body (empty)
      .endCell();

    const action = beginCell()
      .storeUint(0x0ec3c86d, 32) // action_send_msg
      .storeUint(1, 8) // mode=1
      .storeRef(prev)
      .storeRef(msg)
      .endCell();

    prev = action;
  }
  const outList = prev;

  // 4. Собрать тело для подписи
  const bodyUnsigned = beginCell()
    .storeUint(0x7369676e, 32) // prefix signed_external
    .storeUint(WALLET_ID, 32)
    .storeUint(valid_until, 32)
    .storeUint(seqno, 32)
    .storeRef(outList)
    .storeBit(0) // has_other_actions=0
    .endCell();

  // 5. Подписать
  const hash = bodyUnsigned.hash();
  const signature = sign(hash, SECRET_KEY);

  // 6. Финальное тело (добавить подпись)
  const body = beginCell()
    .storeUint(0x7369676e, 32)
    .storeUint(WALLET_ID, 32)
    .storeUint(valid_until, 32)
    .storeUint(seqno, 32)
    .storeRef(outList)
    .storeBit(0)
    .storeBuffer(signature, 64)
    .endCell();

  // 7. ОТПРАВКА через toncenter API (sendBoc)
  const boc = body.toBoc({ idx: false }).toString('base64');

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
  return data.result;
}

// ...и helper выше
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
