import { giftRepository } from '../../database/repositories/giftRepository';
import { GiftStatus } from '../../models/Gift';

export const saveGiftToDatabase = async ({
  giftId,
  collectionName,
  number,
  model,
  pattern,
  backdrop,
  owner,
}) => {
  const existing = await giftRepository.findOneBy({ id: giftId });
  if (existing) {
    throw new Error(`Gift with id ${giftId} already exists`);
  }

  const gift = giftRepository.create({
    id: giftId,
    collection_name: collectionName,
    number,
    model,
    pattern,
    backdrop,
    owner,
    status: GiftStatus.UNLISTED,
    sell_price: 0,
    sell_price_with_fee: 0,
    listed_date: null,
    trasfered_date: null,
  });

  return await giftRepository.save(gift);
};
