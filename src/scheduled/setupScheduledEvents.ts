import { resetWeeklyMarketVolume } from './resetWeeklyMarketVolume';
import { runDepositWatcher } from './tonDepositWatcher';
import { runTonWithdrawWatcher } from './tonWithdrawWatcher';

export const setupScheduledEvents = () => {
  runDepositWatcher();
  runTonWithdrawWatcher();
  resetWeeklyMarketVolume();

  console.log('📅 Scheduled Events setteled');
};
