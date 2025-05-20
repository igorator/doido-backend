import { bot } from '../../bot/bot';
import { transferStarsCount } from '../../shared/constants';
import { checkCurrentStarsBalance } from '../stars/checkCurrentStarsBalance';

const BUSINESS_CONNECTION_ID = process.env.TELEGRAM_BUSINESS_CONNECTION_ID;

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
      transferStarsCount,
    );
    return result;
  } catch (error) {
    console.error('❌ Ошибка при передаче подарка:', error);
    throw error;
  }
};
