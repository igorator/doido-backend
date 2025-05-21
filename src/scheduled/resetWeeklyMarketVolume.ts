import cron from 'node-cron';

import { User } from '../models/User';
import { AppDataSource } from '../database/db';

// каждый понедельник в 00:00
export const resetWeeklyMarketVolume = () => {
  cron.schedule('0 0 * * 1', async () => {
    console.log('🔁 Сброс weekly_market_amount...');

    try {
      await AppDataSource.createQueryBuilder()
        .update(User)
        .set({ weekly_market_amount: 0 })
        .execute();

      console.log('✅ Weekly market amounts reset');
    } catch (err) {
      console.error('❌ Ошибка при сбросе weekly_market_amount:', err);
    }
  });
};
