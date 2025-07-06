import { EntityManager } from 'typeorm';
import Decimal from 'decimal.js';

import {
  REFERRAL_PERCENT_FEE,
  INFLUENCER_REFERRAL_PERCENT_FEE,
} from '../../shared/constants';

import { GiftStatus } from '../../models/Gift';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { sendBalanceUpdate } from '../../sockets/sendBalanceUpdate';
import { MarketInfo } from '../../models/MarketInfo';
import { Activity, ActivityItemType } from '../../models/Activity';

export async function buyGiftsService(
  manager: EntityManager,
  telegramUserId: number,
  giftIds: string[],
) {
  const buyer = await manager.findOneOrFail(userRepository.target, {
    where: { id: String(telegramUserId) },
  });

  const gifts = await manager.find(giftRepository.target, {
    where: giftIds.map((id) => ({ id })),
    relations: ['owner'],
  });

  if (gifts.length !== giftIds.length) {
    throw new Error('Some of gifts not found or invalid');
  }

  const totalCost = gifts.reduce(
    (sum, gift) => sum.plus(gift.sell_price_with_fee),
    new Decimal(0),
  );

  if (
    !totalCost.isFinite() ||
    totalCost.isZero() ||
    totalCost.isNegative() ||
    buyer.ton_balance.isNegative() ||
    buyer.ton_balance.lessThan(totalCost)
  ) {
    throw new Error('Insufficient balance.');
  }

  let sellerId: string | null = null;
  const createdActivities: Activity[] = [];
  let totalCommission = new Decimal(0);
  let referralBonuses = new Decimal(0);

  for (const gift of gifts) {
    const seller = gift.owner;
    if (
      gift.status !== GiftStatus.LISTED ||
      !seller ||
      seller.id === buyer.id
    ) {
      throw new Error(`Invalid gift ID: ${gift?.id}`);
    }

    if (sellerId === null) sellerId = seller.id;

    const sellPrice = gift.sell_price;
    const sellPriceWithFee = gift.sell_price_with_fee;
    const commission = sellPriceWithFee.minus(sellPrice);
    totalCommission = totalCommission.plus(commission);

    buyer.ton_balance = buyer.ton_balance.minus(sellPriceWithFee);
    seller.ton_balance = seller.ton_balance.plus(sellPrice);

    const sellerRef = await manager.findOne(userRepository.target, {
      where: { id: seller.id },
      relations: ['referred_by'],
    });

    let refLog = ' | 💸 Бонус не начислен (нет реферала у продавца)';
    if (sellerRef?.referred_by) {
      const ref = sellerRef.referred_by;
      const feePercent = ref.is_influencer
        ? new Decimal(INFLUENCER_REFERRAL_PERCENT_FEE)
        : new Decimal(REFERRAL_PERCENT_FEE);

      const bonusAmount = commission.mul(feePercent).toDecimalPlaces(8);
      referralBonuses = referralBonuses.plus(bonusAmount);

      const oldRefBalance = new Decimal(ref.ton_balance);
      const oldRefProfit = new Decimal(ref.referred_profit);

      if (ref.id === buyer.id) {
        buyer.ton_balance = buyer.ton_balance.plus(bonusAmount);
        buyer.referred_profit = buyer.referred_profit.plus(bonusAmount);
      } else {
        ref.ton_balance = oldRefBalance.plus(bonusAmount);
        ref.referred_profit = oldRefProfit.plus(bonusAmount);
        ref.total_market_amount = ref.total_market_amount.plus(bonusAmount);
        ref.weekly_market_amount = ref.weekly_market_amount.plus(bonusAmount);
        await manager.save(ref);
      }

      refLog = ` | 💸 Бонус ${bonusAmount.toFixed(3)} TON → ${
        ref.is_influencer ? 'инфлюенсеру' : 'рефералу'
      } ${ref.username} (${ref.id})`;
    }

    buyer.total_market_amount =
      buyer.total_market_amount.plus(sellPriceWithFee);
    buyer.weekly_market_amount =
      buyer.weekly_market_amount.plus(sellPriceWithFee);
    seller.total_market_amount =
      seller.total_market_amount.plus(sellPriceWithFee);
    seller.weekly_market_amount =
      seller.weekly_market_amount.plus(sellPriceWithFee);

    await manager.save([buyer, seller]);

    const activity = manager.create(Activity, {
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
      created_at: new Date(),
    });

    createdActivities.push(activity);

    gift.owner = buyer;
    gift.status = GiftStatus.UNLISTED;
    gift.sell_price = new Decimal(0);
    gift.sell_price_with_fee = new Decimal(0);
    gift.listed_date = null;
    gift.free_listings_used = 0;

    await manager.save(gift);

    console.log(
      `🛒🏱 ПОКУПКА ПОДАРКА: ${buyer.username} (${buyer.id}) купил ${
        gift.collection_name
      } #${gift.number} у ${seller.username} (${
        seller.id
      }) за ${sellPriceWithFee.toFixed(3)} TON${refLog}`,
    );
  }

  await manager.save(createdActivities);

  const marketInfo = await manager.findOneByOrFail(MarketInfo, { id: 1 });
  const netProfit = totalCommission.minus(referralBonuses);
  marketInfo.profit = marketInfo.profit.plus(netProfit);
  await manager.save(marketInfo);

  console.log(
    `🏦 PROFIT LOG | Marketplace profit: ${netProfit.toFixed(
      6,
    )} TON | Total commission: ${totalCommission.toFixed(
      6,
    )} TON | Referral bonuses: ${referralBonuses.toFixed(6)} TON`,
  );

  if (sellerId) sendBalanceUpdate(sellerId);
  sendBalanceUpdate(buyer.id);

  return {
    boughtGifts: gifts,
    updatedBalance: buyer.ton_balance,
    activities: createdActivities,
  };
}
