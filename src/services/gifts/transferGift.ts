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
  newOwnerId = Number(newOwnerId);

  await checkCurrentStarsBalance(BUSINESS_CONNECTION_ID);

  try {
    const result = await bot.api.transferGift(
      BUSINESS_CONNECTION_ID,
      giftId,
      newOwnerId,
      TRANSFER_STARS_COUNT,
    );
    console.log('✅ Подарок успешно передан:', result);
    return result;
  } catch (error) {
    console.error('❌ Ошибка при передаче подарка:', error);
    throw error;
  }
};
