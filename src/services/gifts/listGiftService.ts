import Decimal from 'decimal.js';
import { AppDataSource } from '../../database/db';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { GiftStatus, Gift } from '../../models/Gift';
import { User } from '../../models/User';
import { incrementMarketProfit } from '../market/incrementMarketProfit';
import { notifyGiftListed } from '../notifications/giftNotifications';
import { createHttpError } from '../../shared/lib/httpError';
import { config } from '../../config';

const MARKET_FEE = new Decimal(config.fees.marketPercent);
const LISTING_FEE = new Decimal(config.fees.giftListing);
const MIN_SELL_PRICE = config.limits.minSellPrice;
const MAX_SELL_PRICE = config.limits.maxSellPrice;
const MAX_FREE_LISTINGS = config.limits.maxFreeListings;

export interface ListGiftInput {
  giftId: string;
  ownerId: string;
  price: number;
}

export interface ListGiftResult {
  gift: Gift;
  owner: User;
  feeApplied: boolean;
}

export async function listGiftService(input: ListGiftInput): Promise<ListGiftResult> {
  const { giftId, ownerId, price } = input;

  const basePrice = new Decimal(price);

  if (basePrice.lt(MIN_SELL_PRICE)) {
    throw createHttpError(`Price must be at least ${MIN_SELL_PRICE} TON`, 400);
  }
  if (basePrice.gt(MAX_SELL_PRICE)) {
    throw createHttpError(`Price must not exceed ${MAX_SELL_PRICE} TON`, 400);
  }

  const priceWithFee = basePrice.mul(MARKET_FEE.plus(1)).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);

  const result = await AppDataSource.transaction(async (manager) => {
    const gift = await manager.findOne(giftRepository.target, {
      where: { id: giftId },
      relations: ['owner'],
    });

    if (!gift) {
      throw createHttpError('Gift not found', 404);
    }

    if (!gift.owner || gift.owner.id !== ownerId) {
      throw createHttpError('Forbidden: not your gift', 403);
    }

    const owner = await manager
      .getRepository(userRepository.target)
      .createQueryBuilder('user')
      .setLock('pessimistic_write')
      .where('user.id = :id', { id: gift.owner.id })
      .getOneOrFail();

    let feeApplied = false;

    if (gift.free_listings_used >= MAX_FREE_LISTINGS) {
      if (owner.ton_balance.lessThan(LISTING_FEE)) {
        throw createHttpError('Insufficient balance for listing fee', 402);
      }
      owner.ton_balance = owner.ton_balance.minus(LISTING_FEE);
      await manager.save(owner);
      feeApplied = true;
    }

    gift.free_listings_used += 1;
    gift.status = GiftStatus.LISTED;
    gift.sell_price = basePrice;
    gift.sell_price_with_fee = priceWithFee;
    gift.listed_date = new Date();

    await manager.save(gift);

    return { gift, owner, feeApplied };
  });

  if (result.feeApplied) {
    incrementMarketProfit('gift_listing', LISTING_FEE).catch((err) =>
      console.error('❌ Failed to record listing fee profit:', err),
    );
  }

  notifyGiftListed(result.gift, result.owner, result.feeApplied);

  return result;
}
