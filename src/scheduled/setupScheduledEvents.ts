import { checkForDeposits } from './checkForIncomingDeposites';
import { checkForPendingWithdrawBatches } from './checkForPendingWithdrawBatches';
import { resetWeeklyMarketVolume } from './resetWeeklyMarketVolume';

export const setupScheduledEvents = () => {
  checkForDeposits();
  checkForPendingWithdrawBatches();
  resetWeeklyMarketVolume();
  console.log('📅 Scheduled Events setteled');
};
