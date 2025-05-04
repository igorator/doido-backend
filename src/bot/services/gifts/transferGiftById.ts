import { bot } from '../../bot';

export const transferGift = async ({
  business_connection_id,
  owned_gift_id,
  new_owner_chat_id,
  star_count,
  signal,
}) => {
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
