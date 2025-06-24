import { refreshLeaderboard } from '../services/leaderboard/refreshLeaderboard';
import cron from 'node-cron';

export const runLeaderboardRefresher = () => {
  cron.schedule('*/10 * * * *', async () => {
    try {
      await refreshLeaderboard();
      console.log('✅ Leaderboard refreshed at', new Date().toISOString());
    } catch (err) {
      console.error('❌ Failed to refresh leaderboard:', err);
    }
  });

  console.log('📅 Leaderboard refresher cron started (every 10 minutes)');
};
