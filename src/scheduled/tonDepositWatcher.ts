import { TonClient, Address } from '@ton/ton';
import { Cell } from '@ton/core';
import { DepositLog } from '../models/ton/DepositLog';
import { AppDataSource } from '../database/db';
import { plusUserBalance } from '../services/user/updateUserBalance';
import Decimal from 'decimal.js';
import { IsNull, Not } from 'typeorm';
import { sendBalanceUpdate } from '../sockets/sendBalanceUpdate';

const TON_DEPOSIT_WALLET_ADDRESS = process.env.TON_DEPOSIT_WALLET_ADDRESS!;
const WATCHER_INTERVAL_MS =
  Number(process.env.TON_DEPOSIT_WATCHER_INTERVAL_MS) || 15000;

const tonClient = new TonClient({
  endpoint: process.env.TONCENTER_API_ENDPOINT!,
  apiKey: process.env.TONCENTER_API_KEY,
});

function formatNanoToTon(nanoValue: bigint | string | number): string {
  const nano = BigInt(nanoValue).toString();
  if (nano.length <= 9) return '0.' + nano.padStart(9, '0');
  const whole = nano.slice(0, nano.length - 9);
  const fraction = nano.slice(-9);
  return `${whole}.${fraction}`.replace(/\.0+$/, '');
}

function extractPayloadFromMessage(transaction: any): string | null {
  const messageBody = transaction.inMessage?.body;

  if (messageBody instanceof Cell) {
    try {
      const parsedCell = messageBody
        .beginParse()
        .loadBuffer(messageBody.bits.length / 8);
      const uuidBytes = parsedCell.subarray(4);
      const uuid = Buffer.from(uuidBytes)
        .toString('utf-8')
        .replace(/\0/g, '')
        .trim();
      if (uuid) return uuid;
    } catch (error) {
      console.warn('[Deposit] ⚠️ Ошибка при разборе Cell payload:', error);
    }
  }

  const maybeText = messageBody?.text || messageBody?.toString?.();
  if (maybeText && typeof maybeText === 'string' && maybeText.length > 10) {
    return maybeText.trim();
  }

  return null;
}

async function handleIncomingTransaction(transaction: any) {
  const message = transaction.inMessage;
  const transactionId = transaction.lt?.toString() ?? 'unknown';
  const amountReceivedNano = transaction.inMessage?.info?.value?.coins ?? 0n;
  const receivedAt = transaction.now
    ? new Date(transaction.now * 1000).toISOString()
    : 'нет now';

  const senderAddress =
    message?.info?.type === 'internal' && message.info.src instanceof Address
      ? message.info.src.toString()
      : '???';

  if (!message || transaction.outMessagesCount > 0) return;

  const payload = extractPayloadFromMessage(transaction);
  if (!payload) return;

  const depositRepository = AppDataSource.getRepository(DepositLog);
  const depositRecord = await depositRepository.findOne({ where: { payload } });

  if (!depositRecord) return;
  if (depositRecord.status !== 'pending') return;

  if (BigInt(depositRecord.amountNano) !== amountReceivedNano) {
    depositRecord.status = 'failed';
    await depositRepository.save(depositRecord);
    console.warn(
      `[Deposit] ❌ Сумма не совпадает. Payload: "${payload}", ожидалось: ${formatNanoToTon(
        depositRecord.amountNano,
      )}, пришло: ${formatNanoToTon(amountReceivedNano)}. User: ${
        depositRecord.userId
      }`,
    );
    return;
  }

  try {
    await plusUserBalance(
      depositRecord.userId,
      new Decimal(formatNanoToTon(depositRecord.amountNano)),
    );
    sendBalanceUpdate(depositRecord.userId);

    depositRecord.status = 'confirmed';
    depositRecord.utime = transaction.now;
    depositRecord.lt = transaction.lt?.toString() ?? null;
    await depositRepository.save(depositRecord);

    console.log(
      `[Deposit] ✅ [${transactionId}] ${formatNanoToTon(
        amountReceivedNano,
      )} TON от ${senderAddress}, payload "${payload}" подтверждён. User: ${
        depositRecord.userId
      }, At: ${receivedAt}`,
    );
  } catch (error) {
    depositRecord.status = 'failed';
    await depositRepository.save(depositRecord);
    console.error(
      `[Deposit] ❌ Ошибка при зачислении. Payload: "${payload}", User: ${
        depositRecord.userId
      }, Amount: ${formatNanoToTon(
        amountReceivedNano,
      )}, At: ${receivedAt}. Ошибка:`,
      error,
    );
  }
}

export async function runDepositWatcher() {
  const walletAddress = Address.parse(TON_DEPOSIT_WALLET_ADDRESS);
  const depositRepository = AppDataSource.getRepository(DepositLog);

  let lastSeenLogicalTime: string | undefined;
  let isProcessing = false;

  const lastConfirmed = await depositRepository.findOne({
    where: { status: 'confirmed', lt: Not(IsNull()) },
    order: { lt: 'DESC' },
  });
  if (lastConfirmed?.lt) lastSeenLogicalTime = lastConfirmed.lt.toString();

  async function checkNewTransactions() {
    if (isProcessing) {
      console.warn('[Deposit] ⚠️ Пропуск тика: уже обрабатывается.');
      return;
    }

    isProcessing = true;

    const now = new Date().toISOString();
    try {
      const pendingCount = await depositRepository.count({
        where: { status: 'pending' },
      });
      console.log(
        `[TON Deposit Watcher] Working at ${now} | pending deposits: ${pendingCount}`,
      );

      const recentTransactions = await tonClient.getTransactions(
        walletAddress,
        {
          limit: 20,
          lt: lastSeenLogicalTime,
          archival: true,
        },
      );

      if (!recentTransactions.length) return;

      for (const transaction of [...recentTransactions].reverse()) {
        await handleIncomingTransaction(transaction);
        lastSeenLogicalTime = transaction.lt.toString();
      }
    } catch (error) {
      console.error('[Deposit] ❌ Ошибка в watcher:', error);
    } finally {
      isProcessing = false;
    }
  }

  setInterval(checkNewTransactions, WATCHER_INTERVAL_MS);
  console.log(
    `[Deposit] 🚀 Watcher депозитов TON запущен. Адрес кошелька: ${TON_DEPOSIT_WALLET_ADDRESS}`,
  );
  await checkNewTransactions();
}
