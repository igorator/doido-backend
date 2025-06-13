import { resetWeeklyMarketVolume } from './resetWeeklyMarketVolume';
import { runDepositWatcher } from './tonDepositWatcher';
import { runTonWithdrawWatcher } from './tonWithdrawWatcher';

export const setupScheduledEvents = () => {
  resetWeeklyMarketVolume();
  runDepositWatcher();
  runTonWithdrawWatcher();

  console.log('📅 Scheduled Events setteled');
};
