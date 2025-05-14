import { bot } from '../../bot/bot';
import { transferStarsCount } from '../../shared/constants';
import { checkCurrentStarsBalance } from '../stars/checkCurrentStarsBalance';

export const transferGift = async ({
  business_connection_id,
  owned_gift_id,
  new_owner_chat_id,
  star_count = transferStarsCount,
  signal,
}: {
  business_connection_id: string;
  owned_gift_id: string;
  new_owner_chat_id: string | number;
  star_count: number;
  signal?: any;
}) => {
  new_owner_chat_id = Number(new_owner_chat_id);

  await checkCurrentStarsBalance(business_connection_id);

  try {
    const result = await bot.api.transferGift(
      business_connection_id,
      owned_gift_id,
      new_owner_chat_id,
      star_count,
      signal,
    );
    return result;
  } catch (error) {
    console.error('❌ Ошибка при передаче подарка:', error);
    throw error;
  }
};
