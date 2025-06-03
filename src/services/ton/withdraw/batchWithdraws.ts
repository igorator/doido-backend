import Decimal from 'decimal.js';
import { withdrawBatchRepository } from '../../../database/repositories/ton/withdraw/withdrawBatchRepository';
import { withdrawLogRepository } from '../../../database/repositories/ton/withdraw/withdrawLogRepository';
import { plusUserBalance } from '../../user/updateUserBalance';
import { sendTonMultiWithdraw } from './sendTonMultiWithdraw';

export const processWithdrawBatch = async (batchId: number) => {
  // 1. Получить все логи для этого батча
  const withdrawLogs = await withdrawLogRepository.find({
    where: { batchId },
    order: { createdAt: 'ASC' },
  });

  if (withdrawLogs.length === 0) {
    // Если батч пустой, пометить как failed и выйти
    await withdrawBatchRepository.update({ id: batchId }, { status: 'failed' });
    return;
  }

  try {
    // 2. Подготовить recipients для мультивывода
    const recipients = withdrawLogs.map((log) => ({
      to: log.to,
      amount: log.amount,
    }));

    // 3. Отправить мультивывод через смарт-контракт
    const txHash = await sendTonMultiWithdraw(recipients);

    // 4. Если всё прошло — отметить все как confirmed
    const processedAt = Date.now();
    for (const log of withdrawLogs) {
      log.status = 'confirmed';
      log.txHash = txHash;
      log.processedAt = processedAt;
    }
    await withdrawLogRepository.save(withdrawLogs);

    await withdrawBatchRepository.update(
      { id: batchId },
      { status: 'confirmed', txHash, processedAt },
    );
  } catch (err: any) {
    for (const log of withdrawLogs) {
      log.status = 'failed';
      log.processedAt = Date.now();

      await plusUserBalance(log.userId, new Decimal(log.amount));
    }
    await withdrawLogRepository.save(withdrawLogs);

    await withdrawBatchRepository.update(
      { id: batchId },
      { status: 'failed', processedAt: Date.now() },
    );
  }
};
