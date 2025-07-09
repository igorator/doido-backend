import { AppDataSource } from '../database/db';
import { keyPairFromSecretKey } from '@ton/crypto';
import { tonClient } from '../ton/tonClient';
import { WalletContractV5R1, SendMode, internal, toNano } from '@ton/ton';
import { Address } from '@ton/core';
import Decimal from 'decimal.js';
import { logger } from '../shared/lib/logger';
import { WithdrawLog } from '../models/ton/WithdrawLog';
import { WithdrawBatch } from '../models/ton/WithdrawBatch';
import { plusUserBalance } from '../services/user/updateUserBalance';
import { sendBalanceUpdate } from '../sockets/sendBalanceUpdate';

const withdrawLogRepository = AppDataSource.getRepository(WithdrawLog);
const withdrawBatchRepository = AppDataSource.getRepository(WithdrawBatch);

// 🔐 Secrets & config
const WITHDRAW_SECRET_KEY = process.env.TON_WITHDRAW_WALLET_SECRET_KEY!;
const DEPOSIT_SECRET_KEY = process.env.TON_DEPOSIT_WALLET_SECRET_KEY!;
const MAX_BATCH_SIZE = Number(process.env.TON_WITHDRAW_MAX_BATCH_SIZE) || 20;
const WITHDRAW_INTERVAL_MS =
  Number(process.env.TON_WITHDRAW_INTERVAL_MS) || 15000;
const TON_SUBWALLET_NUMBER = Number(process.env.TON_SUBWALLET_NUMBER) || 0;
const WITHDRAW_REFILL_AMOUNT =
  Number(process.env.TON_WITHDRAW_REFILL_AMOUNT) || 50;

const withdrawSecretKey = Buffer.from(WITHDRAW_SECRET_KEY, 'hex');
const depositSecretKey = Buffer.from(DEPOSIT_SECRET_KEY, 'hex');
const { publicKey: withdrawPublicKey } =
  keyPairFromSecretKey(withdrawSecretKey);
const { publicKey: depositPublicKey } = keyPairFromSecretKey(depositSecretKey);

const inFlightBatches = new Set<number>();

// 🛠 Helpers
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createWallet(publicKey: Buffer) {
  return WalletContractV5R1.create({
    publicKey,
    walletId: {
      networkGlobalId: -239,
      context: {
        walletVersion: 'v5r1',
        workchain: 0,
        subwalletNumber: TON_SUBWALLET_NUMBER,
      },
    },
  });
}

// 💸 Возврат баланса пользователю
async function refundUserBalanceIfNeeded(log: WithdrawLog) {
  if (!log.wasDebited) return;
  if (log.status !== 'failed') return;

  try {
    await plusUserBalance(log.userId, new Decimal(log.amount));
    console.log(
      `[Withdraw Watcher] Refunded ${log.amount} TON to userId=${log.userId}`,
    );
  } catch (err) {
    console.error(
      `[Withdraw Watcher] ❌ Refund failed for userId=${log.userId}:`,
      err,
    );
  } finally {
    sendBalanceUpdate(log.userId.toString());
  }
}
// ❌ Обработка ошибки батча
async function markBatchAndLogsAsFailed(
  batch: WithdrawBatch,
  logs: WithdrawLog[],
  reason: string,
) {
  const failedAt = (Date.now() / 1000) | 0;

  for (const log of logs) {
    await withdrawLogRepository.update(
      { id: log.id },
      { status: 'failed', processedAt: failedAt },
    );

    const freshLog = await withdrawLogRepository.findOneBy({ id: log.id });
    if (freshLog) {
      await refundUserBalanceIfNeeded(freshLog);
    }
  }

  await withdrawBatchRepository.update(
    { id: batch.id },
    { status: 'failed', processedAt: failedAt },
  );

  console.error(`[Withdraw Watcher] ❌ Batch #${batch.id} failed: ${reason}`);
}

// ➕ Пополнение withdraw-кошелька
async function refillWithdrawWalletIfNeeded(
  toAddress: string,
  refillAmountNano: bigint,
): Promise<boolean> {
  const depositWallet = createWallet(depositPublicKey);
  const depositBalance = await tonClient.getBalance(
    Address.parse(depositWallet.address.toString()),
  );

  if (depositBalance < refillAmountNano) {
    console.warn(
      `[Withdraw Watcher] ❌ Not enough balance on DEPOSIT wallet. Needed ${refillAmountNano}, got ${depositBalance}`,
    );
    return false;
  }

  const provider = tonClient.provider(depositWallet.address);
  const seqno = await depositWallet.getSeqno(provider);

  const transfer = depositWallet.createTransfer({
    seqno,
    secretKey: depositSecretKey,
    messages: [
      internal({ to: toAddress, value: refillAmountNano, bounce: true }),
    ],
    sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
  });

  try {
    await tonClient.sendExternalMessage(depositWallet, transfer);
    console.log(
      `[Withdraw Watcher] 🔄 Sent refill of ${WITHDRAW_REFILL_AMOUNT} TON to ${toAddress}`,
    );
    return true;
  } catch (err) {
    console.error(`[Withdraw Watcher] ❌ Refill send failed:`, err);
    return false;
  }
}

// 📦 Основная логика: группировка и отправка
async function batchAndSendWithdrawals() {
  const wallet = createWallet(withdrawPublicKey);

  const pending = await withdrawLogRepository.find({
    where: { status: 'pending', batchId: null },
    order: { createdAt: 'ASC' },
    take: MAX_BATCH_SIZE,
  });

  const valid = pending.filter((log) => log.wasDebited);
  if (!valid.length) {
    console.warn('[Withdraw Watcher] ⚠️ No valid debited logs to process');
    return;
  }

  const batch = withdrawBatchRepository.create({
    status: 'processing',
    createdAt: (Date.now() / 1000) | 0,
    withdraws: valid,
  });
  await withdrawBatchRepository.save(batch);
  inFlightBatches.add(batch.id);

  try {
    for (const log of valid) {
      log.batchId = batch.id;
      log.status = 'processing';
      await withdrawLogRepository.save(log);
    }

    const totalNano = valid.reduce(
      (acc, log) => acc + BigInt(toNano(log.amount).toString()),
      BigInt(0),
    );

    let walletBalance = await tonClient.getBalance(
      Address.parse(wallet.address.toString()),
    );
    if (walletBalance < totalNano) {
      console.log('[Withdraw Watcher] 💰 Not enough balance, trying refill...');
      const refillNano = BigInt(Math.floor(WITHDRAW_REFILL_AMOUNT * 1e9));

      let refillSuccess = false;
      for (let i = 0; i < 2; i++) {
        if (
          await refillWithdrawWalletIfNeeded(
            wallet.address.toString(),
            refillNano,
          )
        ) {
          await sleep(5000);
          walletBalance = await tonClient.getBalance(
            Address.parse(wallet.address.toString()),
          );
          if (walletBalance >= totalNano) {
            refillSuccess = true;
            break;
          }
        }
      }

      if (!refillSuccess) {
        await markBatchAndLogsAsFailed(batch, valid, 'Refill failed');
        return;
      }
    }

    const messages = valid.map((log) =>
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

    const txHash = transfer.hash().toString('hex');
    batch.status = 'confirmed';
    batch.txHash = txHash;
    batch.processedAt = (Date.now() / 1000) | 0;
    await withdrawBatchRepository.save(batch);

    for (const log of valid) {
      log.status = 'confirmed';
      log.txHash = txHash;
      log.processedAt = batch.processedAt;
      await withdrawLogRepository.save(log);

      console.log(
        `[Withdraw Watcher] ✅ Sent: userId=${log.userId}, amount=${log.amount} TON`,
      );
    }

    console.log(`[Withdraw Watcher] ✅ Batch #${batch.id} confirmed`);
  } catch (err) {
    await markBatchAndLogsAsFailed(
      batch,
      valid,
      `Transfer error: ${err instanceof Error ? err.message : 'unknown'}`,
    );
  } finally {
    inFlightBatches.delete(batch.id);
  }
}

// 🔁 Воркера
export function runTonWithdrawWatcher() {
  const wallet = createWallet(withdrawPublicKey);
  console.log(`[Withdraw Watcher] 🚀 Started at ${wallet.address.toString()}`);
  console.log(
    `[Withdraw Watcher] Config: batchSize=${MAX_BATCH_SIZE}, interval=${WITHDRAW_INTERVAL_MS}ms`,
  );

  let isProcessing = false;

  async function tick() {
    const now = new Date().toISOString();
    const pendingCount = await withdrawLogRepository.count({
      where: { status: 'pending', batchId: null },
    });

    console.log(
      `[Withdraw Watcher] Tick at ${now} | pending logs: ${pendingCount}`,
    );

    if (isProcessing) {
      console.log('[Withdraw Watcher] ⏩ Skip tick: already processing');
      return;
    }

    isProcessing = true;
    try {
      if (inFlightBatches.size === 0) {
        await batchAndSendWithdrawals();
      } else {
        console.log(
          `[Withdraw Watcher] ⏳ Waiting: ${inFlightBatches.size} batch in flight`,
        );
      }
    } catch (err) {
      console.error('[Withdraw Watcher] ❌ Tick error:', err);
    } finally {
      isProcessing = false;
    }
  }

  tick();
  setInterval(tick, WITHDRAW_INTERVAL_MS);
}
