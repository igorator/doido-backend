import { WithdrawBatch } from '../models/ton/WithdrawBatch';
import { WithdrawLog } from '../models/ton/WithdrawLog';
import { AppDataSource } from '../database/db';
import { internal, toNano, WalletContractV5R1, SendMode } from '@ton/ton';
import { tonClient } from '../ton/tonClient';
import { keyPairFromSecretKey } from '@ton/crypto';
import { plusUserBalance } from '../services/user/updateUserBalance';
import { Address } from '@ton/core';
import Decimal from 'decimal.js';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const WITHDRAW_SECRET_KEY = process.env.TON_WITHDRAW_WALLET_SECRET_KEY!;
const DEPOSIT_SECRET_KEY = process.env.TON_DEPOSIT_WALLET_SECRET_KEY!;
const MAX_BATCH_SIZE = Number(process.env.TON_WITHDRAW_MAX_BATCH_SIZE) || 8;
const WITHDRAW_INTERVAL_MS =
  Number(process.env.TON_WITHDRAW_INTERVAL_MS) || 10000;
const TON_SUBWALLET_NUMBER = Number(process.env.TON_SUBWALLET_NUMBER) || 0;
const WITHDRAW_REFILL_AMOUNT =
  Number(process.env.TON_WITHDRAW_REFILL_AMOUNT) || 50;

const withdrawLogRepository = AppDataSource.getRepository(WithdrawLog);
const withdrawBatchRepository = AppDataSource.getRepository(WithdrawBatch);

const withdrawSecretKey = Buffer.from(WITHDRAW_SECRET_KEY, 'hex');
const { publicKey: withdrawPublicKey } =
  keyPairFromSecretKey(withdrawSecretKey);

const depositSecretKey = Buffer.from(DEPOSIT_SECRET_KEY, 'hex');
const { publicKey: depositPublicKey } = keyPairFromSecretKey(depositSecretKey);

const inFlightBatches = new Set<number>();

async function refundUserBalanceIfNeeded(log: WithdrawLog) {
  try {
    await plusUserBalance(log.userId, new Decimal(log.amount));
  } catch (err) {
    console.error(
      `[TON Withdraw Watcher] Failed to refund userId=${log.userId}:`,
      err,
    );
  }
}

async function refillWithdrawWalletIfNeeded(
  targetAddress: string,
  requiredNano: bigint,
) {
  const refillAmountNano = BigInt(Math.floor(WITHDRAW_REFILL_AMOUNT * 1e9));
  const depositWallet = WalletContractV5R1.create({
    publicKey: depositPublicKey,
    walletId: {
      networkGlobalId: -239,
      context: { walletVersion: 'v5r1', workchain: 0, subwalletNumber: 0 },
    },
  });

  const provider = tonClient.provider(depositWallet.address);
  const depositBalance = await tonClient.getBalance(
    Address.parse(depositWallet.address.toString()),
  );
  if (depositBalance < refillAmountNano) {
    throw new Error(
      '[TON Withdraw Watcher] Not enough balance on DEPOSIT wallet for refill',
    );
  }

  await sleep(5000);

  const seqno = await depositWallet.getSeqno(provider);

  const transfer = depositWallet.createTransfer({
    seqno,
    secretKey: depositSecretKey,
    messages: [
      internal({
        to: targetAddress,
        value: refillAmountNano,
        bounce: true,
      }),
    ],
    sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
  });

  await tonClient.sendExternalMessage(depositWallet, transfer);

  console.log(
    `[TON Withdraw Watcher] Sent refill of ${WITHDRAW_REFILL_AMOUNT} TON to ${targetAddress}`,
  );

  // Дожидаемся появления средств на withdraw-кошельке (жёсткая гарантия)
  let retries = 0;
  while (retries < 15) {
    // max 75 сек
    const updatedBalance = await tonClient.getBalance(
      Address.parse(targetAddress),
    );
    if (updatedBalance >= requiredNano) break;
    await sleep(5000);
    retries++;
  }
}

async function batchAndSendWithdrawals() {
  if (inFlightBatches.size) {
    console.log(
      '[TON Withdraw Watcher] Batch already processing, skip this tick.',
    );
    return;
  }

  const wallet = WalletContractV5R1.create({
    publicKey: withdrawPublicKey,
    walletId: {
      networkGlobalId: -239,
      context: {
        walletVersion: 'v5r1',
        workchain: 0,
        subwalletNumber: TON_SUBWALLET_NUMBER,
      },
    },
  });

  const pending = await withdrawLogRepository.find({
    where: { status: 'pending', batchId: null },
    order: { createdAt: 'ASC' },
    take: MAX_BATCH_SIZE,
  });

  if (!pending.length) return;

  const batch = new WithdrawBatch();
  batch.status = 'processing';
  batch.createdAt = Math.floor(Date.now() / 1000);
  batch.withdraws = pending;
  await withdrawBatchRepository.save(batch);

  inFlightBatches.add(batch.id);

  for (const log of pending) {
    log.batchId = batch.id;
    log.status = 'processing';
    await withdrawLogRepository.save(log);
  }

  // Сумма всех выплат
  const totalBatchNano = pending
    .map((l) => BigInt(toNano(l.amount).toString()))
    .reduce((a, b) => a + b, BigInt(0));
  // Баланс withdraw-кошелька
  const withdrawWalletBalance = await tonClient.getBalance(
    Address.parse(wallet.address.toString()),
  );

  if (withdrawWalletBalance < totalBatchNano) {
    console.log(
      '[TON Withdraw Watcher] Not enough balance for batch, need refill',
    );
    await refillWithdrawWalletIfNeeded(
      wallet.address.toString(),
      totalBatchNano,
    );
  }

  const messages = pending.map((log) =>
    internal({
      to: log.to,
      value: toNano(log.amount),
      bounce: true,
    }),
  );

  const provider = tonClient.provider(wallet.address);
  let seqno: number;
  try {
    seqno = await wallet.getSeqno(provider);
  } catch (err) {
    console.error(
      '[TON Withdraw Watcher] Seqno read error, fail all logs:',
      err,
    );
    for (const log of pending) {
      log.status = 'failed';
      log.processedAt = Math.floor(Date.now() / 1000);
      await withdrawLogRepository.save(log);
      await refundUserBalanceIfNeeded(log);
    }
    batch.status = 'failed';
    batch.processedAt = Math.floor(Date.now() / 1000);
    await withdrawBatchRepository.save(batch);
    inFlightBatches.delete(batch.id);
    throw err;
  }

  let transfer;
  try {
    transfer = wallet.createTransfer({
      seqno,
      secretKey: withdrawSecretKey,
      messages,
      sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
    });
  } catch (err) {
    console.error(
      '[TON Withdraw Watcher] Transfer build error, fail all logs:',
      err,
    );
    for (const log of pending) {
      log.status = 'failed';
      log.processedAt = Math.floor(Date.now() / 1000);
      await withdrawLogRepository.save(log);
      await refundUserBalanceIfNeeded(log);
    }
    batch.status = 'failed';
    batch.processedAt = Math.floor(Date.now() / 1000);
    await withdrawBatchRepository.save(batch);
    inFlightBatches.delete(batch.id);
    throw err;
  }

  try {
    await tonClient.sendExternalMessage(wallet, transfer);

    batch.status = 'confirmed';
    batch.txHash = transfer.hash().toString('hex');
    batch.processedAt = Math.floor(Date.now() / 1000);
    await withdrawBatchRepository.save(batch);

    for (const log of pending) {
      log.status = 'confirmed';
      log.txHash = transfer.hash().toString('hex');
      log.processedAt = Math.floor(Date.now() / 1000);
      await withdrawLogRepository.save(log);
    }
    console.log(
      `[TON Withdraw Watcher] Batch #${batch.id} confirmed, tx: ${batch.txHash}`,
    );
  } catch (e) {
    batch.status = 'failed';
    batch.processedAt = Math.floor(Date.now() / 1000);
    await withdrawBatchRepository.save(batch);

    for (const log of pending) {
      log.status = 'failed';
      log.processedAt = Math.floor(Date.now() / 1000);
      await withdrawLogRepository.save(log);
      await refundUserBalanceIfNeeded(log);
    }
    console.error(`[TON Withdraw Watcher] Batch #${batch.id} failed:`, e);
    throw e;
  } finally {
    inFlightBatches.delete(batch.id);
  }
}

export function runTonWithdrawWatcher() {
  console.log('[TON Withdraw Watcher] Started');
  let isProcessing = false;

  const tick = async () => {
    const now = new Date().toISOString();
    console.log(`[TON Withdraw Watcher] Working at ${now}`);
    if (isProcessing) return;
    isProcessing = true;
    try {
      await batchAndSendWithdrawals();
    } catch (e) {
      // already logged
    } finally {
      isProcessing = false;
    }
  };

  tick();
  setInterval(tick, WITHDRAW_INTERVAL_MS);
}
