import cron from 'node-cron';
import { depositWatcher } from '../ton/workers/depositWatcher';

export const checkForDeposits = (cronExpression = '*/1 * * * *') => {
  cron.schedule(cronExpression, async () => {
    try {
      await depositWatcher();
    } catch (err) {
      console.error('[checkForDeposits] error', err);
    }
  });
};
