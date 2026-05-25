import { bot } from '../../bot/bot';
import { TRANSFER_STARS_COUNT } from '../../shared/constants';
import { checkCurrentStarsBalance } from '../stars/checkCurrentStarsBalance';
import { config } from '../../config';

const BUSINESS_CONNECTION_ID = config.telegram.businessConnectionId;

export const transferGift = async ({
  giftId,
  newOwnerId,
}: {
  giftId: string;
  newOwnerId: string | number;
}) => {
  if (!BUSINESS_CONNECTION_ID) {
    throw new Error('TELEGRAM_BUSINESS_CONNECTION_ID is not configured');
  }

  const numericOwnerId = Number(newOwnerId);

  await checkCurrentStarsBalance(BUSINESS_CONNECTION_ID);

  try {
    const result = await bot.api.transferGift(
      BUSINESS_CONNECTION_ID,
      giftId,
      numericOwnerId,
      TRANSFER_STARS_COUNT,
    );
    console.log('✅ Gift transferred successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error transferring gift:', error);
    throw error;
  }
};
