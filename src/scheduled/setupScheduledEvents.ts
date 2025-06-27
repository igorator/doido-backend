import { runLeaderboardRefresher } from './leaderboardRefresher';
import { resetWeeklyMarketVolume } from './resetWeeklyMarketVolume';
import { runDepositWatcher } from './tonDepositWatcher';
import { runTonWithdrawWatcher } from './tonWithdrawWatcher';

export const setupScheduledEvents = () => {
  if (process.env.NODE_ENV !== 'development') {
    resetWeeklyMarketVolume();
    runLeaderboardRefresher();
    runDepositWatcher();
    runTonWithdrawWatcher();
    console.log('📅 Scheduled Events (watchers) started');
  } else {
    console.log('⚠️ Watchers are disabled in development mode');
  }
};
