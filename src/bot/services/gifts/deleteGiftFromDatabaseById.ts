import { giftRepository } from '../../../database/repositories/giftRepository';

export const deleteGiftFromDatabaseById = async (gift_id: string) => {
  const gift = await giftRepository.findOneBy({ id: gift_id });
  if (!gift) {
    throw new Error(`Gift with id ${gift_id} not found`);
  }

  await giftRepository.remove(gift);
};
