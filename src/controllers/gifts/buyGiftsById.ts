import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { botSendMessage } from '../../services/messages/botSendMessage';
import { transferGift } from '../../services/gifts/transferGift';
import { GiftStatus } from '../../models/Gift';
import { Activity, ActivityItemType } from '../../models/Activity';
import Decimal from 'decimal.js';
import { sendBalanceUpdate } from '../../sockets/sendBalanceUpdate';

const log = (...args: any[]) =>
  console.log(`[${new Date().toISOString()}]`, ...args);

export const buyGiftsByIds = async (req: Request, res: Response) => {
  const telegramUser = (req as any).telegramUser;
  const { gift_ids, externalPurchase } = req.body;
  const REFERRAL_FEE = new Decimal(process.env.REFERRAL_FEE || '0');

  if (!telegramUser?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!Array.isArray(gift_ids) || gift_ids.length === 0) {
    return res.status(400).json({ error: 'No gift IDs provided' });
  }

  try {
    const { boughtGifts, updatedBalance, activities } =
      await AppDataSource.transaction(async (manager) => {
        const buyer = await manager.findOneOrFail(userRepository.target, {
          where: { id: String(telegramUser.id) },
        });

        const gifts = await manager.find(giftRepository.target, {
          where: gift_ids.map((id) => ({ id })),
          relations: ['owner'],
        });

        let totalCost = new Decimal(0);

        for (const gift of gifts) {
          if (
            gift.status !== GiftStatus.LISTED ||
            !gift.owner ||
            gift.owner.id === buyer.id
          ) {
            throw new Error(`Invalid gift ID: ${gift?.id}`);
          }
          totalCost = totalCost.plus(gift.sell_price_with_fee);
        }

        if (buyer.ton_balance.lessThan(totalCost)) {
          throw new Error('Недостаточно баланса для покупки всех подарков');
        }

        const createdActivities: Activity[] = [];

        for (const gift of gifts) {
          const seller = gift.owner;
          const sellPrice = gift.sell_price;
          const sellPriceWithFee = gift.sell_price_with_fee;
          const commission = sellPriceWithFee.minus(sellPrice);
          const referralBonus = commission.mul(REFERRAL_FEE);
          const bonusAmount = referralBonus.toDecimalPlaces(8);

          buyer.ton_balance = buyer.ton_balance.minus(sellPriceWithFee);
          seller.ton_balance = seller.ton_balance.plus(sellPrice);

          const sellerRef = await manager.findOne(userRepository.target, {
            where: { id: seller.id },
            relations: ['referred_by'],
          });

          if (sellerRef?.referred_by) {
            const ref = sellerRef.referred_by;

            ref.ton_balance = new Decimal(ref.ton_balance).plus(bonusAmount);
            ref.referred_profit = new Decimal(ref.referred_profit).plus(
              bonusAmount,
            );

            await manager.save(ref);
          }

          buyer.total_market_amount =
            buyer.total_market_amount.plus(sellPriceWithFee);
          buyer.weekly_market_amount =
            buyer.weekly_market_amount.plus(sellPriceWithFee);
          seller.total_market_amount =
            seller.total_market_amount.plus(sellPriceWithFee);
          seller.weekly_market_amount =
            seller.weekly_market_amount.plus(sellPriceWithFee);

          await manager.save(buyer);
          await manager.save(seller);

          sendBalanceUpdate(seller.id, seller.ton_balance.toNumber());

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
            amount: gift.sell_price,
            created_at: new Date(),
          });
          createdActivities.push(activity);

          gift.owner = buyer;
          gift.status = GiftStatus.UNLISTED;
          gift.sell_price = new Decimal(0);
          gift.sell_price_with_fee = new Decimal(0);
          gift.listed_date = null;
          gift.transferred_date = null;
          gift.free_listings_used = 0;

          await manager.save(gift);

          log(
            `🛒🎁 ПОКУПКА ПОДАРКА: ${buyer.username} (${buyer.id}) купил ${
              gift.collection_name
            } #${gift.number} у ${seller.username} (${
              seller.id
            }) за \x1b[38;2;0;152;234m${sellPriceWithFee.toFixed(
              3,
            )} TON\x1b[0m` +
              (sellerRef?.referred_by
                ? ` | 💸 Бонус ${bonusAmount.toFixed(3)} TON → ${
                    sellerRef.referred_by.username
                  } (${sellerRef.referred_by.id})`
                : ` | 💸 Бонус не начислен (нет реферала у продавца)`),
          );
        }

        await manager.save(createdActivities);

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
          await giftRepository.update(gift.id, {
            status: GiftStatus.TRANSFERRED,
            transferred_date: new Date(),
          });
          console.log(
            `📦 Подарок ${gift.collection_name} #${gift.number} передан пользователю ${telegramUser.id}`,
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
          `🎉 Ваш подарок <b>${activity.gift_collection_name} #${activity.gift_number}</b> был продан за <code>${activity.amount} TON</code>`,
          'HTML',
        ),
      ),
    );
  } catch (err: any) {
    console.error(
      `🚫 НЕУДАЧНАЯ ПОКУПКА: ${telegramUser?.username} (${telegramUser?.id}) — ${err.message}`,
    );
    res.status(400).json({ error: err.message || 'Failed to buy gifts' });
  }
};
