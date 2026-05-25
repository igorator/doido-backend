import cron from 'node-cron';
import { User } from '../models/User';
import { AppDataSource } from '../database/db';
import { config } from '../config';

export const resetWeeklyMarketVolume = (cronExpr = config.cron.resetWeeklyMarket) => {
  cron.schedule(cronExpr, async () => {
    try {
      await AppDataSource.createQueryBuilder()
        .update(User)
        .set({ weekly_market_amount: 0 })
        .execute();

      console.log('✅ Weekly market amounts reset');
    } catch (err) {
      console.error('❌ Error resetting weekly_market_amount:', err);
    }
  });
};
