import { giftRepository } from '../../database/repositories/giftRepository';
import { Gift, GiftStatus } from '../../models/Gift';
import { User } from '../../models/User';

interface SaveGiftInput {
  giftId: string;
  collectionName: string;
  number: number;
  model: {
    name: string;
    rarity: number;
    emoji: string;
  };
  pattern: {
    name: string;
    rarity: number;
    emoji: string;
  };
  backdrop: {
    name: string;
    rarity: number;
    center_color: string;
    edge_color: string;
    symbol_color: string;
    text_color: string;
  };
  owner: User;
}

export const saveGiftToDatabase = async (input: SaveGiftInput): Promise<Gift> => {
  const { giftId, collectionName, number, model, pattern, backdrop, owner } = input;

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
  });

  return giftRepository.save(gift);
};
