import { botSendMessage } from '../messages/botSendMessage';
import { config } from '../../config';

const STARS_DEPOSITER_ID = config.telegram.starsDepositerId;
const MIN_STARS_THRESHOLD = config.telegram.minStarsThreshold;

export async function notifyStarsBalanceFetchFailed(businessConnectionId: string): Promise<void> {
  await botSendMessage(
    STARS_DEPOSITER_ID,
    `❌ Failed to fetch star balance for business account <code>${businessConnectionId}</code>`,
    'HTML',
  );
}

export async function notifyStarsBalanceLow(currentAmount: number): Promise<void> {
  console.warn(`⚠️ Star balance below threshold: ${currentAmount} < ${MIN_STARS_THRESHOLD}`);

  await botSendMessage(
    STARS_DEPOSITER_ID,
    `⚠️ Low star balance! Current: <b>${currentAmount}</b> stars.`,
    'HTML',
  );
}
