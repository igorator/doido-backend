import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { botSendMessage } from '../../services/messages/botSendMessage';
import { transferGift } from '../../services/gifts/transferGift';
import { GiftStatus } from '../../models/Gift';
import { Activity, ActivityItemType } from '../../models/Activity';
import { MarketInfo } from '../../models/MarketInfo';
import Decimal from 'decimal.js';
import { sendBalanceUpdate } from '../../sockets/sendBalanceUpdate';
import {
  INFLUENCER_REFERRAL_PERCENT_FEE,
  REFERRAL_PERCENT_FEE,
} from '../../shared/constants';

const log = (...args: any[]) =>
  console.log(`[${new Date().toISOString()}]`, ...args);

export const buyGiftsByIds = async (req: Request, res: Response) => {
  const telegramUser = (req as any).telegramUser;
  const { gift_ids, externalPurchase } = req.body;

  if (!telegramUser?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!Array.isArray(gift_ids) || gift_ids.length === 0) {
    res.status(400).json({ error: 'No gift IDs provided' });
    return;
  }

  const uniqueGiftIds = Array.from(new Set(gift_ids));

  try {
    const { boughtGifts, updatedBalance, activities } =
      await AppDataSource.transaction(async (manager) => {
        const buyer = await manager
          .getRepository(userRepository.target)
          .createQueryBuilder('user')
          .setLock('pessimistic_write')
          .where('user.id = :id', { id: String(telegramUser.id) })
          .getOneOrFail();

        const gifts = await manager
          .getRepository(giftRepository.target)
          .createQueryBuilder('gift')
          .innerJoinAndSelect('gift.owner', 'owner') // 👈 фикс
          .where('gift.id IN (:...ids)', { ids: uniqueGiftIds })
          .setLock('pessimistic_write') // теперь можно
          .getMany();

        if (gifts.length !== uniqueGiftIds.length) {
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
          throw new Error(`Insufficient balance.`);
        }

        buyer.ton_balance = buyer.ton_balance.minus(totalCost);
        buyer.total_market_amount = buyer.total_market_amount.plus(totalCost);
        buyer.weekly_market_amount = buyer.weekly_market_amount.plus(totalCost);
        await manager.save(buyer);

        const sellerIds = new Set<string>();
        const createdActivities: Activity[] = [];
        let totalCommission = new Decimal(0);
        let referralBonuses = new Decimal(0);
        let buyerWasUpdated = false;

        for (const gift of gifts) {
          const seller = gift.owner;

          if (
            gift.status !== GiftStatus.LISTED ||
            !seller ||
            seller.id === buyer.id
          ) {
            throw new Error(`Invalid gift ID: ${gift?.id}`);
          }

          sellerIds.add(seller.id);

          const sellPrice = gift.sell_price;
          const sellPriceWithFee = gift.sell_price_with_fee;
          const commission = sellPriceWithFee.minus(sellPrice);
          totalCommission = totalCommission.plus(commission);

          seller.ton_balance = seller.ton_balance.plus(sellPrice);
          seller.total_market_amount =
            seller.total_market_amount.plus(sellPriceWithFee);
          seller.weekly_market_amount =
            seller.weekly_market_amount.plus(sellPriceWithFee);

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
              buyerWasUpdated = true;
            } else {
              ref.ton_balance = oldRefBalance.plus(bonusAmount);
              ref.referred_profit = oldRefProfit.plus(bonusAmount);
              ref.total_market_amount =
                ref.total_market_amount.plus(bonusAmount);
              ref.weekly_market_amount =
                ref.weekly_market_amount.plus(bonusAmount);
              await manager.save(ref);
            }

            const newRefBalance =
              ref.id === buyer.id ? buyer.ton_balance : ref.ton_balance;
            const newRefProfit =
              ref.id === buyer.id ? buyer.referred_profit : ref.referred_profit;

            const type = ref.is_influencer ? 'инфлюенсеру' : 'рефералу';
            refLog = ` | 💸 Бонус ${bonusAmount.toFixed(3)} TON → ${type} ${
              ref.username
            } (${ref.id}) [баланс: ${oldRefBalance.toFixed(
              3,
            )} → ${newRefBalance.toFixed(3)}, profit: ${oldRefProfit.toFixed(
              3,
            )} → ${newRefProfit.toFixed(3)}]`;
          }

          await manager.save(seller);

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
            amount: gift.sell_price_with_fee,
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

          log(
            `🛒🏱 ПОКУПКА ПОДАРКА: ${buyer.username} (${buyer.id}) купил ${
              gift.collection_name
            } #${gift.number} у ${seller.username} (${
              seller.id
            }) за \x1b[38;2;0;152;234m${sellPriceWithFee.toFixed(
              3,
            )} TON\x1b[0m${refLog}`,
          );
        }

        if (buyerWasUpdated) {
          await manager.save(buyer);
        }

        await manager.save(createdActivities);

        const marketInfoRepo = manager.getRepository(MarketInfo);
        const marketInfo = await marketInfoRepo.findOneBy({ id: 1 });
        if (!marketInfo) throw new Error('Market info record not found');

        const netProfit = totalCommission.minus(referralBonuses);
        marketInfo.profit = marketInfo.profit.plus(netProfit);
        await marketInfoRepo.save(marketInfo);

        log(
          `🏦 PROFIT LOG | Marketplace profit: ${netProfit.toFixed(
            6,
          )} TON | Total commission: ${totalCommission.toFixed(
            6,
          )} TON | Referral bonuses: ${referralBonuses.toFixed(6)} TON`,
        );

        for (const id of sellerIds) sendBalanceUpdate(id);
        sendBalanceUpdate(buyer.id);

        return {
          boughtGifts: gifts,
          updatedBalance: buyer.ton_balance,
          activities: createdActivities,
        };
      });

    res.status(200).json({
      success: true,
      bought: boughtGifts.map((gift) => gift.id),
      updated_balance: updatedBalance,
      external: Boolean(externalPurchase),
    });

    if (externalPurchase) {
      for (const gift of boughtGifts) {
        try {
          await transferGift({ giftId: gift.id, newOwnerId: telegramUser.id });
          await giftRepository.delete(gift.id);

          console.log(
            `📦 Подарок ${gift.collection_name} #${gift.number} передан и удалён (id ${gift.id}) пользователю ${telegramUser.id}`,
          );

          await new Promise((r) => setTimeout(r, 1000));
        } catch (err) {
          console.error(`❌ Ошибка передачи подарка ${gift.id}:`, err);
        }
      }
    }

    await Promise.all(
      activities.map((activity) =>
        botSendMessage(
          activity.seller.id,
          `🎉 Your gift <b>${activity.gift_collection_name} #${activity.gift_number}</b> was sold for <code>${activity.amount} TON</code>`,
          'HTML',
        ),
      ),
    );
  } catch (err: any) {
    console.error(
      `🛑 НЕУДАЧНАЯ ПОКУПКА: ${telegramUser?.username} (${telegramUser?.id}) — ${err.message}`,
    );
    res.status(400).json({ error: err.message || 'Failed to buy gifts' });
  }
};
