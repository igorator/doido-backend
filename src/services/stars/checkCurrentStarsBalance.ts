import { getStarsBalance } from './getStarsBalance';
import {
  notifyStarsBalanceFetchFailed,
  notifyStarsBalanceLow,
} from '../notifications/starsNotifications';
import { config } from '../../config';

const CHECK_BALANCE_COOLDOWN_MS = 120_000;

const lastCheckTimestamps = new Map<string, number>();

export const checkCurrentStarsBalance = async (
  businessConnectionId: string,
): Promise<{ ok: boolean; currentAmount: number }> => {
  const now = Date.now();
  const lastCheck = lastCheckTimestamps.get(businessConnectionId);

  if (lastCheck && now - lastCheck < CHECK_BALANCE_COOLDOWN_MS) {
    return { ok: true, currentAmount: Infinity };
  }

  lastCheckTimestamps.set(businessConnectionId, now);

  const currentAmount = await getStarsBalance(businessConnectionId);

  if (currentAmount === null) {
    await notifyStarsBalanceFetchFailed(businessConnectionId);
    return { ok: false, currentAmount: 0 };
  }

  if (currentAmount < config.telegram.minStarsThreshold) {
    await notifyStarsBalanceLow(currentAmount);
    return { ok: false, currentAmount };
  }

  return { ok: true, currentAmount };
};
