import { withdrawLogRepository } from '../../database/repositories/ton/withdraw/withdrawLogRepository';
import { withdrawBatchRepository } from '../../database/repositories/ton/withdraw/withdrawBatchRepository';
import { sendTonMultiWithdraw } from '../../services/ton/withdraw/sendTonMultiWithdraw';
import { requestWithdrawRefill } from '../../services/ton/requestWithdrawRefill';
import { getTonBalanceService } from '../../services/ton/getTonBalanceService';
const MAX_BATCH_SIZE = Number(process.env.TON_WITHDRAW_MAX_BATCH_SIZE) || 8;
const WITHDRAW_WALLET = process.env.TON_WITHDRAW_WALLET!;
const WITHDRAW_REFILL_AMOUNT = process.env.TON_WITHDRAW_REFILL_AMOUNT!; // строка TON, например '10'

export const batchAndSendWithdrawals = async () => {
  try {
    const pendingLogs = await withdrawLogRepository.find({
      where: { status: 'pending', batchId: null },
      order: { createdAt: 'ASC' },
      take: MAX_BATCH_SIZE,
    });

    if (pendingLogs.length === 0) return;

    const batch = await withdrawBatchRepository.save({
      createdAt: Date.now(),
      status: 'processing',
    });

    for (const log of pendingLogs) {
      log.batchId = batch.id;
      log.status = 'processing';
    }
    await withdrawLogRepository.save(pendingLogs);

    // 1. Считаем общую сумму для вывода
    const totalAmount = pendingLogs.reduce(
      (acc, log) => acc + Number(log.amount),
      0,
    );

    // 2. Проверяем баланс выводного кошелька
    const withdrawBalance = await getTonBalanceService(WITHDRAW_WALLET);

    if (withdrawBalance < totalAmount) {
      // Запросить рефил с депозитного кошелька
      await requestWithdrawRefill(WITHDRAW_WALLET, WITHDRAW_REFILL_AMOUNT);

      // Пометить батч как waiting_refill
      await withdrawBatchRepository.update(
        { id: batch.id },
        { status: 'waiting_refill' },
      );

      for (const log of pendingLogs) {
        log.status = 'waiting_refill';
      }
      await withdrawLogRepository.save(pendingLogs);

      console.log(
        `[${new Date().toISOString()}] Batch #${
          batch.id
        } is waiting for refill.`,
      );

      return; // не продолжаем вывод
    }

    // 4. Подготовить recipients
    const recipients = pendingLogs.map((log) => ({
      to: log.to,
      amount: log.amount,
      userId: log.userId,
      id: log.id,
    }));

    // 5. Попробовать отправить мультивывод
    let txHash: string | null = null;
    try {
      txHash = await sendTonMultiWithdraw(recipients);
    } catch (err) {
      // Ошибка транзакции — пометить все failed
      for (const log of pendingLogs) {
        log.status = 'failed';
        log.txHash = null;
        log.processedAt = Date.now();
      }
      await withdrawLogRepository.save(pendingLogs);

      await withdrawBatchRepository.update(
        { id: batch.id },
        { status: 'failed', processedAt: Date.now() },
      );
      throw err;
    }

    for (const log of pendingLogs) {
      log.status = 'confirmed';
      log.txHash = txHash;
      log.processedAt = Date.now();
    }
    await withdrawLogRepository.save(pendingLogs);

    await withdrawBatchRepository.update(
      { id: batch.id },
      { status: 'confirmed', txHash, processedAt: Date.now() },
    );

    console.log(
      `[${new Date().toISOString()}] Batch #${batch.id} sent. ${
        pendingLogs.length
      } payouts, txHash: ${txHash}`,
    );
  } catch (err) {
    console.error(`[withdrawCronTask] error`, err);
  }
};
