import Decimal from 'decimal.js';
import { giftRepository } from '../../database/repositories/giftRepository';
import { GiftStatus, Gift } from '../../models/Gift';

export async function unlistGiftService(gift: Gift): Promise<Gift> {
  gift.status = GiftStatus.UNLISTED;
  gift.sell_price = new Decimal(0);
  gift.sell_price_with_fee = new Decimal(0);
  gift.listed_date = null;
  return giftRepository.save(gift);
}
