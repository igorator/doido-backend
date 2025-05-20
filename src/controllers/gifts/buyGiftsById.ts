import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { botSendMessage } from '../../services/messages/botSendMessage';
import { transferGift } from '../../services/gifts/transferGift';
import { GiftStatus } from '../../models/Gift';
import { Activity, ActivityItemType } from '../../models/Activity';
import Decimal from 'decimal.js';

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

  try {
    const { boughtGifts, updatedBalance, activities } =
      await AppDataSource.transaction(async (manager) => {
        const buyer = await manager.findOneByOrFail(userRepository.target, {
          id: String(telegramUser.id),
        });

        const gifts = await manager.find(giftRepository.target, {
          where: gift_ids.map((id) => ({ id })),
          relations: ['owner'],
        });

        const affectedUsers = new Map<string, typeof buyer>();
        const createdActivities: Activity[] = [];
        let totalCost = new Decimal(0);

        for (const gift of gifts) {
          if (
            gift.status !== GiftStatus.LISTED ||
            !gift.owner ||
            gift.owner.id === buyer.id
          ) {
            throw new Error(`Invalid gift ID: ${gift?.id}`);
          }

          const seller = gift.owner;
          const sellPrice = gift.sell_price;
          const sellPriceWithFee = gift.sell_price_with_fee;

          totalCost = totalCost.plus(sellPriceWithFee);
          buyer.ton_balance = buyer.ton_balance.minus(sellPriceWithFee);
          seller.ton_balance = seller.ton_balance.plus(sellPrice);

          const activity = manager.create(Activity, {
            item_type: ActivityItemType.GIFT,
            item_id: gift.id,
            gift,
            seller,
            buyer,
            amount: sellPrice,
            created_at: new Date().toISOString(),
          });

          createdActivities.push(activity);

          gift.owner = buyer;
          gift.status = GiftStatus.UNLISTED;
          gift.sell_price = new Decimal(0);
          gift.sell_price_with_fee = new Decimal(0);
          gift.listed_date = null;
          gift.transferred_date = null;

          affectedUsers.set(seller.id, seller);
        }

        if (buyer.ton_balance.lessThan(0)) {
          throw new Error('Insufficient balance');
        }

        affectedUsers.set(buyer.id, buyer);

        await manager.save([...affectedUsers.values()]);
        await manager.save(gifts);
        await manager.save(createdActivities);

        return {
          boughtGifts: gifts,
          updatedBalance: buyer.ton_balance,
          activities: createdActivities,
        };
      });

    res.status(200).json({
      success: true,
      bought: boughtGifts.map((g) => g.id),
      updated_balance: updatedBalance,
      external: Boolean(externalPurchase),
    });

    if (externalPurchase) {
      await Promise.all(
        boughtGifts.map(async (gift) => {
          try {
            await transferGift({
              giftId: gift.id,
              newOwnerId: telegramUser.id,
            });

            await giftRepository.update(gift.id, {
              status: GiftStatus.TRANSFERRED,
              transferred_date: new Date(),
            });
          } catch (err) {
            console.error(`❌ Failed to transfer gift ${gift.id}:`, err);
          }
        }),
      );
    }

    await Promise.all(
      activities.map((activity) =>
        botSendMessage(
          activity.seller.id,
          `🎉 Your gift <b>${activity.gift.collection_name} #${activity.gift.number}</b> was sold for <code>${activity.amount} TON</code>`,
          'HTML',
        ),
      ),
    );
  } catch (err: any) {
    console.error('❌ Transaction failed:', err);
    res.status(400).json({ error: err.message || 'Failed to buy gifts' });
  }
};
