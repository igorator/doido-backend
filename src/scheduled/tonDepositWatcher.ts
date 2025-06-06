import { TonClient, Address } from '@ton/ton';
import { Cell } from '@ton/core';
import { DepositLog } from '../models/ton/DepositLog';
import { AppDataSource } from '../database/db';
import { plusUserBalance } from '../services/user/updateUserBalance';
import Decimal from 'decimal.js';
import { IsNull, Not } from 'typeorm';

const DEPOSIT_WALLET_ADDRESS = process.env.TON_DEPOSIT_WALLET!;
const DEPOSIT_WATCHER_INTERVAL_MS =
  Number(process.env.TON_DEPOSIT_WATCHER_INTERVAL_MS) || 10000;
const tonClient = new TonClient({
  endpoint: process.env.TONCENTER_API_ENDPOINT!,
  apiKey: process.env.TONCENTER_API_KEY,
});

// Переводит nanoTON в человекочитаемый TON
function fromNano(nano: bigint | string | number): string {
  const n = BigInt(nano).toString();
  if (n.length <= 9) return '0.' + n.padStart(9, '0');
  const left = n.slice(0, n.length - 9);
  const right = n.slice(-9);
  return `${left}.${right}`.replace(/\.?0+$/, '');
}

// Достаёт payload (uuid) из TON Cell
function extractPayload(tx: any): string | null {
  if (tx.inMessage?.body && tx.inMessage.body.bits.length > 0) {
    try {
      const cell = tx.inMessage.body as Cell;
      const bytes = cell.beginParse().loadBuffer(cell.bits.length / 8);
      // Первые 4 байта — это opcode, дальше uuid
      const uuidBytes = bytes.subarray(4);
      const uuid = Buffer.from(uuidBytes)
        .toString('utf-8')
        .replace(/\0/g, '')
        .trim();
      if (uuid) return uuid;
    } catch {}
  }
  return null;
}

// Обработка одной транзакции
async function onTransaction(tx: any) {
  const txId = tx.lt ? tx.lt.toString() : 'unknown';
  const value = tx.inMessage?.info?.value?.coins ?? 0n;
  const timestamp = tx.now ? new Date(tx.now * 1000).toISOString() : 'нет now';

  let from = '???';
  try {
    const info = tx.inMessage?.info?.source?.info;
    if (info && typeof info.src === 'string') {
      from = info.src;
    }
  } catch (e) {
    from = '???';
  }

  // Только входящие внутренние транзакции без outMessages
  if (!tx.inMessage || tx.outMessagesCount > 0) return;

  const payload = extractPayload(tx);
  if (!payload) return;

  const repo = AppDataSource.getRepository(DepositLog);
  // Ищем только pending депозиты
  const deposit = await repo.findOne({ where: { payload, status: 'pending' } });
  if (!deposit) return;

  // Сумма должна точно совпадать
  if (BigInt(deposit.amountNano) !== value) return;

  try {
    await plusUserBalance(
      deposit.userId,
      new Decimal(fromNano(deposit.amountNano)),
    );
    deposit.status = 'confirmed';
    deposit.utime = tx.now;
    deposit.lt = tx.lt ? tx.lt.toString() : undefined;
    await repo.save(deposit);

    console.log(
      `[Deposit] ✅ [${txId}] Депозит на ${fromNano(
        value,
      )} TON от ${from} с payload "${payload}" подтверждён и зачислен на баланс! User: ${
        deposit.userId
      }, At: ${timestamp}`,
    );
  } catch (err) {
    deposit.status = 'failed';
    await repo.save(deposit);

    console.log(
      `[Deposit] ❌ [${txId}] Не удалось зачислить депозит. User: ${
        deposit.userId
      }, Wallet: ${from}, Payload: "${payload}", Amount: ${fromNano(
        value,
      )}, At: ${timestamp}. Ошибка: ${err}`,
    );
  }
}

export async function runDepositWatcher() {
  const walletAddress = Address.parse(DEPOSIT_WALLET_ADDRESS);

  let lastMinLt: string | undefined = undefined;
  const repo = AppDataSource.getRepository(DepositLog);
  const last = await repo.findOne({
    where: { status: 'confirmed', lt: Not(IsNull()) },
    order: { lt: 'ASC' },
  });
  if (last?.lt) lastMinLt = last.lt.toString();

  let tickCount = 0;

  async function tick() {
    tickCount++;
    const now = new Date().toISOString();
    console.log(`[TON Deposit Watcher] Working at ${now}`);

    try {
      const txs = await tonClient.getTransactions(walletAddress, { limit: 20 });

      if (!txs.length) return;

      for (const tx of txs) {
        await onTransaction(tx);
      }
    } catch (e) {
      console.error('[Deposit] Ошибка в watcher:', e);
    }
  }

  setInterval(tick, DEPOSIT_WATCHER_INTERVAL_MS);
  console.log(
    `[Deposit] 🚀 Watcher депозитов TON запущен на адресе: ${DEPOSIT_WALLET_ADDRESS}, lastMinLt=${lastMinLt}`,
  );
  await tick();
}
