import { WithdrawBatch } from '../models/ton/WithdrawBatch';
import { WithdrawLog } from '../models/ton/WithdrawLog';
import { AppDataSource } from '../database/db';
import { internal, toNano, WalletContractV5R1, SendMode } from '@ton/ton';
import { tonClient } from '../ton/tonClient';
import { keyPairFromSecretKey } from '@ton/crypto';

const WITHDRAW_SECRET_KEY = process.env.TON_WALLET_SECRET_KEY!;
const MAX_BATCH_SIZE = Number(process.env.TON_WITHDRAW_MAX_BATCH_SIZE) || 8;
const WITHDRAW_INTERVAL_MS =
  Number(process.env.TON_WITHDRAW_INTERVAL_MS) || 10000;

const withdrawLogRepository = AppDataSource.getRepository(WithdrawLog);
const withdrawBatchRepository = AppDataSource.getRepository(WithdrawBatch);

const secretKey = Buffer.from(WITHDRAW_SECRET_KEY, 'hex');
const { publicKey } = keyPairFromSecretKey(secretKey);

// Система защиты: если батч уже был отправлен — не отправлять снова
const inFlightBatches = new Set<number>();

async function batchAndSendWithdrawals() {
  // Проверка на блокировку
  if (inFlightBatches.size) {
    // Если есть батчи "в полёте", ждем их обработки
    console.log(
      '[TON Withdraw Watcher] Batch already processing, skip this tick.',
    );
    return;
  }

  const wallet = WalletContractV5R1.create({
    workchain: 0,
    publicKey,
  });

  const pending = await withdrawLogRepository.find({
    where: { status: 'pending', batchId: null },
    order: { createdAt: 'ASC' },
    take: MAX_BATCH_SIZE,
  });

  if (!pending.length) return;

  // Создаём батч
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
    }
    batch.status = 'failed';
    batch.processedAt = Math.floor(Date.now() / 1000);
    await withdrawBatchRepository.save(batch);
    inFlightBatches.delete(batch.id);
    throw err;
  }

  let transfer;
  try {
    transfer = await wallet.createTransfer({
      seqno,
      secretKey,
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
    // Если батч не отправился, всё возвращаем в 'failed' (safe state)
    batch.status = 'failed';
    batch.processedAt = Math.floor(Date.now() / 1000);
    await withdrawBatchRepository.save(batch);

    for (const log of pending) {
      log.status = 'failed';
      log.processedAt = Math.floor(Date.now() / 1000);
      await withdrawLogRepository.save(log);
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
