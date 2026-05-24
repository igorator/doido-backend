import { runLeaderboardRefresher } from './leaderboardRefresher';
import { resetWeeklyMarketVolume } from './resetWeeklyMarketVolume';
import { runDepositWatcher } from './tonDepositWatcher';
import { runTonWithdrawWatcher } from './tonWithdrawWatcher';
import { config } from '../config';

export const setupScheduledEvents = () => {
  if (!config.server.isDev) {
    runTonWithdrawWatcher();
    resetWeeklyMarketVolume();
    runLeaderboardRefresher();
    runDepositWatcher();

    console.log('📅 Scheduled Events (watchers) started');
  } else {
    console.log('⚠️ Watchers are disabled in development mode');
  }
};
