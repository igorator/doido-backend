import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { activityRepository } from '../../database/repositories/activityRepository';
import { Activity } from '../../models/Activity';

export const BuyGiftsByIds = async (req: Request, res: Response) => {
  const telegramUser = (req as any).telegramUser;
  const { gift_ids, externalPurchase } = req.body;

  if (!telegramUser?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!Array.isArray(gift_ids) || gift_ids.length === 0) {
    return res.status(400).json({ error: 'No gift IDs provided' });
  }

  try {
    const result = await AppDataSource.transaction(async (manager) => {
      const buyer = await manager.findOneByOrFail(userRepository.target, {
        id: String(telegramUser.id),
      });

      const gifts = await manager.find(giftRepository.target, {
        where: gift_ids.map((id) => ({ id })),
        relations: ['owner'],
      });

      const affectedUsers = new Map<string, typeof buyer>();
      const activities: Activity[] = [];
      let totalCost = 0;

      for (const gift of gifts) {
        if (!gift?.is_listed || !gift.owner || gift.owner.id === buyer.id) {
          throw new Error(`Invalid gift ID ${gift?.id}`);
        }

        const seller = gift.owner;
        totalCost += gift.sell_price_with_fee;

        buyer.ton_balance -= gift.sell_price_with_fee;
        seller.ton_balance += gift.sell_price;

        gift.owner = buyer;
        gift.is_listed = false;
        gift.sell_price = 0;
        gift.sell_price_with_fee = 0;
        gift.listed_date = null;

        affectedUsers.set(seller.id, seller);

        const { owner, ...snapshot } = gift;
        const activity = manager.create(Activity, {
          item_type: 'gift',
          item_id: gift.id,
          item_snapshot: snapshot,
          amount: gift.sell_price_with_fee,
          buyer,
          seller,
        });

        activities.push(activity);
      }

      if (buyer.ton_balance < 0) {
        throw new Error('Insufficient balance');
      }

      affectedUsers.set(buyer.id, buyer);

      await manager.save(userRepository.target, [...affectedUsers.values()]);
      await manager.save(giftRepository.target, gifts);
      await manager.save(activityRepository.target, activities);

      return {
        success: true,
        bought: gifts.map((g) => g.id),
        total: totalCost,
        external: Boolean(externalPurchase),
      };
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('❌ Transaction failed:', err);
    return res
      .status(400)
      .json({ error: err.message || 'Failed to buy gifts' });
  }
};
