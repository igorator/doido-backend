import { checkForPendingWithdrawBatches } from './checkForPendingWithdrawBatches';
import { resetWeeklyMarketVolume } from './resetWeeklyMarketVolume';

export const setupScheduledEvents = () => {
  checkForPendingWithdrawBatches();
  resetWeeklyMarketVolume();
  console.log('📅 Scheduled Events setteled');
};
