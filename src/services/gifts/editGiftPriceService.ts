import Decimal from 'decimal.js';
import { giftRepository } from '../../database/repositories/giftRepository';
import { GiftStatus, Gift } from '../../models/Gift';
import { notifyGiftPriceEdited } from '../notifications/giftNotifications';
import { createHttpError } from '../../shared/lib/httpError';
import { config } from '../../config';

const MARKET_FEE = new Decimal(config.fees.marketPercent);
const MIN_SELL_PRICE = config.limits.minSellPrice;
const MAX_SELL_PRICE = config.limits.maxSellPrice;
const PRICE_EDIT_COOLDOWN_SEC = 60;

export interface EditGiftPriceInput {
  gift: Gift;
  price: number;
}

export async function editGiftPriceService(input: EditGiftPriceInput): Promise<Gift> {
  const { gift, price } = input;

  const basePrice = new Decimal(price);

  if (basePrice.lt(MIN_SELL_PRICE)) {
    throw createHttpError(`Price must be at least ${MIN_SELL_PRICE} TON`, 400);
  }
  if (basePrice.gt(MAX_SELL_PRICE)) {
    throw createHttpError(`Price must not exceed ${MAX_SELL_PRICE} TON`, 400);
  }

  if (gift.status !== GiftStatus.LISTED) {
    throw createHttpError('Gift is not listed for sale', 400);
  }

  const lastUpdated = new Date(gift.updated_at ?? gift.created_at).getTime();
  const secondsSinceUpdate = (Date.now() - lastUpdated) / 1000;

  if (secondsSinceUpdate < PRICE_EDIT_COOLDOWN_SEC) {
    const waitSeconds = Math.ceil(PRICE_EDIT_COOLDOWN_SEC - secondsSinceUpdate);
    throw createHttpError(`Wait ${waitSeconds} seconds before editing price again`, 429);
  }

  const priceWithFee = basePrice.mul(MARKET_FEE.plus(1)).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);

  gift.sell_price = basePrice;
  gift.sell_price_with_fee = priceWithFee;

  const savedGift = await giftRepository.save(gift);

  notifyGiftPriceEdited(savedGift);

  return savedGift;
}
