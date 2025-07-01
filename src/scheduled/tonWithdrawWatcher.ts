import { WithdrawBatch } from '../models/ton/WithdrawBatch';
import { WithdrawLog } from '../models/ton/WithdrawLog';
import { AppDataSource } from '../database/db';
import { internal, toNano, WalletContractV5R1, SendMode } from '@ton/ton';
import { tonClient } from '../ton/tonClient';
import { keyPairFromSecretKey } from '@ton/crypto';
import { plusUserBalance } from '../services/user/updateUserBalance';
import { Address } from '@ton/core';
import Decimal from 'decimal.js';
import { sendBalanceUpdate } from '../sockets/sendBalanceUpdate';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const WITHDRAW_SECRET_KEY = process.env.TON_WITHDRAW_WALLET_SECRET_KEY!;
const DEPOSIT_SECRET_KEY = process.env.TON_DEPOSIT_WALLET_SECRET_KEY!;
const MAX_BATCH_SIZE = Number(process.env.TON_WITHDRAW_MAX_BATCH_SIZE) || 20;
const WITHDRAW_INTERVAL_MS =
  Number(process.env.TON_WITHDRAW_INTERVAL_MS) || 15000;
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
  if (log.status === 'failed' && log.processedAt) {
    console.warn(
      `[TON Withdraw Watcher] ⏩ Skip refund: already failed and refunded userId=${log.userId}`,
    );
    return;
  }

  try {
    await plusUserBalance(log.userId, new Decimal(log.amount));
    console.log(
      `[TON Withdraw Watcher] Refunded ${log.amount} TON to userId=${log.userId}`,
    );
  } catch (err) {
    console.error(
      `[TON Withdraw Watcher] ❌ Failed to refund userId=${log.userId}:`,
      err,
    );
  } finally {
    sendBalanceUpdate(log.userId.toString());
  }
}

async function markBatchAndLogsAsFailed(
  batch: WithdrawBatch,
  logs: WithdrawLog[],
  reason: string,
) {
  const failedAt = Math.floor(Date.now() / 1000);

  for (const log of logs) {
    await withdrawLogRepository.update(
      { id: log.id },
      {
        status: 'failed',
        processedAt: failedAt,
      },
    );

    await refundUserBalanceIfNeeded({
      ...log,
      status: 'failed',
      processedAt: failedAt,
    });
  }

  await withdrawBatchRepository.update(
    { id: batch.id },
    {
      status: 'failed',
      processedAt: failedAt,
    },
  );

  console.error(
    `[TON Withdraw Watcher] ❌ Batch #${batch.id} failed: ${reason}`,
  );
}

async function refillWithdrawWalletIfNeeded(
  targetAddress: string,
  refillAmountNano: bigint,
): Promise<boolean> {
  const depositWallet = WalletContractV5R1.create({
    publicKey: depositPublicKey,
    walletId: {
      networkGlobalId: -239,
      context: { walletVersion: 'v5r1', workchain: 0, subwalletNumber: 0 },
    },
  });

  const depositBalance = await tonClient.getBalance(
    Address.parse(depositWallet.address.toString()),
  );
  if (depositBalance < refillAmountNano) {
    console.warn(
      `[TON Withdraw Watcher] ❌ Not enough balance on DEPOSIT wallet`,
    );
    return false;
  }

  const provider = tonClient.provider(depositWallet.address);
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
  return true;
}

async function batchAndSendWithdrawals() {
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

  const batch = withdrawBatchRepository.create({
    status: 'processing',
    createdAt: Math.floor(Date.now() / 1000),
    withdraws: pending,
  });
  await withdrawBatchRepository.save(batch);
  inFlightBatches.add(batch.id);

  try {
    for (const log of pending) {
      log.batchId = batch.id;
      log.status = 'processing';
      await withdrawLogRepository.save(log);
    }

    const totalBatchNano = pending.reduce(
      (acc, log) => acc + BigInt(toNano(log.amount).toString()),
      BigInt(0),
    );

    let withdrawWalletBalance = await tonClient.getBalance(
      Address.parse(wallet.address.toString()),
    );

    if (withdrawWalletBalance < totalBatchNano) {
      console.log(
        `[TON Withdraw Watcher] Not enough balance for batch, attempting refill...`,
      );

      const refillAmountNano = BigInt(Math.floor(WITHDRAW_REFILL_AMOUNT * 1e9));
      let refillSuccess = false;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const ok = await refillWithdrawWalletIfNeeded(
            wallet.address.toString(),
            refillAmountNano,
          );
          if (!ok) {
            console.warn(
              `[TON Withdraw Watcher] ❌ Refill attempt ${attempt} failed: insufficient DEPOSIT balance`,
            );
            continue;
          }

          await sleep(5000);

          withdrawWalletBalance = await tonClient.getBalance(
            Address.parse(wallet.address.toString()),
          );
          if (withdrawWalletBalance >= totalBatchNano) {
            refillSuccess = true;
            break;
          }

          console.warn(
            `[TON Withdraw Watcher] 🕐 Refill attempt ${attempt} did not reach required balance`,
          );
        } catch (err) {
          console.warn(
            `[TON Withdraw Watcher] ❌ Refill attempt ${attempt} failed:`,
            err,
          );
        }
      }

      if (!refillSuccess) {
        await markBatchAndLogsAsFailed(
          batch,
          pending,
          'Refill failed after 5 attempts',
        );
        return;
      }
    }

    const messages = pending.map((log) =>
      internal({ to: log.to, value: toNano(log.amount), bounce: true }),
    );

    const provider = tonClient.provider(wallet.address);
    const seqno = await wallet.getSeqno(provider);

    const transfer = wallet.createTransfer({
      seqno,
      secretKey: withdrawSecretKey,
      messages,
      sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
    });

    await tonClient.sendExternalMessage(wallet, transfer);

    batch.status = 'confirmed';
    batch.txHash = transfer.hash().toString('hex');
    batch.processedAt = Math.floor(Date.now() / 1000);
    await withdrawBatchRepository.save(batch);

    const isoTimestamp = new Date(batch.processedAt * 1000).toISOString();

    for (const log of pending) {
      log.status = 'confirmed';
      log.txHash = batch.txHash;
      log.processedAt = batch.processedAt;
      await withdrawLogRepository.save(log);

      console.log(
        `[TON Withdraw Watcher] ✅ Confirmed transfer: userId=${log.userId}, to=${log.to}, amount=${log.amount} TON, at=${isoTimestamp}`,
      );
    }

    console.log(
      `[TON Withdraw Watcher] ✅ Batch #${batch.id} confirmed, tx: ${batch.txHash}`,
    );
  } catch (err) {
    await markBatchAndLogsAsFailed(
      batch,
      pending,
      `Transfer failed: ${err instanceof Error ? err.message : 'Unknown'}`,
    );
  } finally {
    inFlightBatches.delete(batch.id);
  }
}

export function runTonWithdrawWatcher() {
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

  console.log(
    `[TON Withdraw Watcher] 🚀 Запущен. Адрес: ${wallet.address.toString()} | Batch: ${MAX_BATCH_SIZE} | Interval: ${WITHDRAW_INTERVAL_MS}ms`,
  );

  let isProcessing = false;

  async function tick() {
    const now = new Date().toISOString();
    const pendingCount = await withdrawLogRepository.count({
      where: { status: 'pending', batchId: null },
    });

    console.log(
      `[TON Withdraw Watcher] Working at ${now} | pending: ${pendingCount}`,
    );

    if (isProcessing) {
      console.log(
        '[TON Withdraw Watcher] ⚠️ Пропуск тика: уже обрабатывается.',
      );
      return;
    }

    isProcessing = true;
    try {
      if (inFlightBatches.size === 0) {
        await batchAndSendWithdrawals();
      } else {
        console.log(
          `[TON Withdraw Watcher] ℹ️ Batch в работе (${inFlightBatches.size}), ждём...`,
        );
      }
    } catch (err) {
      console.error('[TON Withdraw Watcher] ❌ Ошибка в тикере:', err);
    } finally {
      isProcessing = false;
    }
  }

  tick();
  setInterval(tick, WITHDRAW_INTERVAL_MS);
}
