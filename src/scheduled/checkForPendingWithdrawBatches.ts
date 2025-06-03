import cron from 'node-cron';
import { batchAndSendWithdrawals } from '../ton/workers/withdrawWatcher';

export const checkForPendingWithdrawBatches = (
  cronExpression = '*/1 * * * *',
) => {
  cron.schedule(cronExpression, async () => {
    try {
      await batchAndSendWithdrawals();
    } catch (err) {
      console.error('[checkForPendingWithdrawBatches] error', err);
    }
  });
};
