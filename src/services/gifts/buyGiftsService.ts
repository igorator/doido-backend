import { EntityManager } from 'typeorm';
import Decimal from 'decimal.js';

import { config } from '../../config';
import { GiftStatus, Gift } from '../../models/Gift';
import { User } from '../../models/User';
import { Activity, ActivityItemType } from '../../models/Activity';
import { MarketInfo } from '../../models/MarketInfo';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { sendBalanceUpdate } from '../../sockets/sendBalanceUpdate';
import {
  notifyGiftSold,
  notifyGiftPurchased,
  notifyGiftPostTransfer,
} from '../notifications/giftNotifications';
import { notifyMarketProfit } from '../notifications/marketNotifications';
import { transferGift } from './transferGift';

const POST_BUY_TRANSFER_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const REFERRAL_FEE = config.fees.referralPercent;
const INFLUENCER_FEE = config.fees.influencerReferralPercent;

export interface BuyGiftsResult {
  boughtGifts: Gift[];
  updatedBalance: Decimal;
  activities: Activity[];
}

export async function buyGiftsService(
  manager: EntityManager,
  buyerId: string,
  giftIds: string[],
): Promise<BuyGiftsResult> {
  const buyer = await manager
    .getRepository(userRepository.target)
    .createQueryBuilder('user')
    .setLock('pessimistic_write')
    .where('user.id = :id', { id: buyerId })
    .getOneOrFail();

  const gifts = await manager
    .getRepository(giftRepository.target)
    .createQueryBuilder('gift')
    .innerJoinAndSelect('gift.owner', 'owner')
    .where('gift.id IN (:...ids)', { ids: giftIds })
    .setLock('pessimistic_write')
    .getMany();

  if (gifts.length !== giftIds.length) {
    throw new Error('Some gifts were not found');
  }

  for (const gift of gifts) {
    if (gift.status !== GiftStatus.LISTED) {
      throw new Error(`Gift ${gift.id} is not listed for sale`);
    }
    if (!gift.owner || gift.owner.id === buyerId) {
      throw new Error(`Gift ${gift.id} cannot be purchased`);
    }
  }

  const totalCost = gifts.reduce((sum, gift) => sum.plus(gift.sell_price_with_fee), new Decimal(0));

  if (!totalCost.isFinite() || totalCost.lte(0)) {
    throw new Error('Invalid total cost');
  }
  if (buyer.ton_balance.lessThan(totalCost)) {
    throw new Error('Insufficient balance');
  }

  const sellerIds = [...new Set(gifts.map((gift) => gift.owner.id))];

  const sellersWithRefs = await manager
    .getRepository(userRepository.target)
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.referred_by', 'ref')
    .where('user.id IN (:...ids)', { ids: sellerIds })
    .setLock('pessimistic_write')
    .getMany();

  const sellerMap = new Map<string, User>(sellersWithRefs.map((seller) => [seller.id, seller]));

  const referrerMap = new Map<string, User>();
  const activities: Activity[] = [];
  let totalCommission = new Decimal(0);
  let referralBonuses = new Decimal(0);

  buyer.ton_balance = buyer.ton_balance.minus(totalCost);
  buyer.total_market_amount = buyer.total_market_amount.plus(totalCost);
  buyer.weekly_market_amount = buyer.weekly_market_amount.plus(totalCost);

  for (const gift of gifts) {
    const seller = sellerMap.get(gift.owner.id)!;
    const sellPrice = gift.sell_price;
    const sellPriceWithFee = gift.sell_price_with_fee;
    const commission = sellPriceWithFee.minus(sellPrice);
    totalCommission = totalCommission.plus(commission);

    seller.ton_balance = seller.ton_balance.plus(sellPrice);
    seller.total_market_amount = seller.total_market_amount.plus(sellPriceWithFee);
    seller.weekly_market_amount = seller.weekly_market_amount.plus(sellPriceWithFee);

    const referrer = seller.referred_by;
    let refLog = '(no referral)';

    if (referrer) {
      const feeRate = new Decimal(referrer.is_influencer ? INFLUENCER_FEE : REFERRAL_FEE);
      const bonusAmount = commission.mul(feeRate).toDecimalPlaces(8);
      referralBonuses = referralBonuses.plus(bonusAmount);

      if (referrer.id === buyerId) {
        buyer.ton_balance = buyer.ton_balance.plus(bonusAmount);
        buyer.referred_profit = buyer.referred_profit.plus(bonusAmount);
      } else {
        let referrerEntity = referrerMap.get(referrer.id);
        if (!referrerEntity) {
          referrerEntity =
            (await manager
              .getRepository(userRepository.target)
              .createQueryBuilder('user')
              .setLock('pessimistic_write')
              .where('user.id = :id', { id: referrer.id })
              .getOne()) ?? referrer;
          referrerMap.set(referrerEntity.id, referrerEntity);
        }
        referrerEntity.ton_balance = referrerEntity.ton_balance.plus(bonusAmount);
        referrerEntity.referred_profit = referrerEntity.referred_profit.plus(bonusAmount);
        referrerEntity.total_market_amount = referrerEntity.total_market_amount.plus(bonusAmount);
        referrerEntity.weekly_market_amount = referrerEntity.weekly_market_amount.plus(bonusAmount);
      }

      const kind = referrer.is_influencer ? 'influencer' : 'referrer';
      refLog = `bonus ${bonusAmount.toFixed(3)} TON → ${kind} ${referrer.id}`;
    }

    activities.push(
      manager.create(Activity, {
        item_type: ActivityItemType.GIFT,
        item_id: gift.id,
        gift_collection_name: gift.collection_name,
        gift_number: gift.number,
        gift_model_name: gift.model?.name ?? null,
        gift_model_rarity: gift.model?.rarity ?? null,
        gift_model_emoji: gift.model?.emoji ?? null,
        gift_pattern_name: gift.pattern?.name ?? null,
        gift_pattern_rarity: gift.pattern?.rarity ?? null,
        gift_pattern_emoji: gift.pattern?.emoji ?? null,
        gift_backdrop_name: gift.backdrop?.name ?? null,
        gift_backdrop_rarity: gift.backdrop?.rarity ?? null,
        gift_backdrop_center_color: gift.backdrop?.center_color ?? null,
        gift_backdrop_edge_color: gift.backdrop?.edge_color ?? null,
        gift_backdrop_symbol_color: gift.backdrop?.symbol_color ?? null,
        gift_backdrop_text_color: gift.backdrop?.text_color ?? null,
        seller,
        buyer,
        amount: sellPriceWithFee,
      }),
    );

    gift.owner = buyer;
    gift.status = GiftStatus.UNLISTED;
    gift.sell_price = new Decimal(0);
    gift.sell_price_with_fee = new Decimal(0);
    gift.listed_date = null;
    gift.free_listings_used = 0;

    notifyGiftPurchased(buyer, seller, gift, sellPriceWithFee, refLog);
  }

  await manager.save(buyer);
  await manager.save([...sellerMap.values()]);

  if (referrerMap.size > 0) {
    await manager.save([...referrerMap.values()]);
  }

  await manager.save(gifts);
  await manager.save(activities);

  const marketInfo = await manager.findOneByOrFail(MarketInfo, { id: 1 });
  const netProfit = totalCommission.minus(referralBonuses);
  marketInfo.profit = marketInfo.profit.plus(netProfit);
  await manager.save(marketInfo);

  notifyMarketProfit(netProfit, totalCommission, referralBonuses);

  const notifyIds = new Set([buyer.id, ...sellerIds, ...referrerMap.keys()]);
  for (const userId of notifyIds) sendBalanceUpdate(userId);

  notifyGiftSold(activities);

  return {
    boughtGifts: gifts,
    updatedBalance: buyer.ton_balance,
    activities,
  };
}

export async function processPostBuyTransfers(
  gifts: Gift[],
  newOwnerId: string | number,
): Promise<void> {
  for (const gift of gifts) {
    try {
      await transferGift({ giftId: gift.id, newOwnerId });
      await giftRepository.delete(gift.id);
      notifyGiftPostTransfer(gift, newOwnerId);
      await sleep(POST_BUY_TRANSFER_DELAY_MS);
    } catch (err) {
      console.error(`❌ Transfer failed for gift ${gift.id}:`, err);
    }
  }
}
