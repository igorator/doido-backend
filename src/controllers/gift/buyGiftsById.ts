import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { botSendMessage } from '../../services/messages/botSendMessage';
import { GiftStatus } from '../../models/Gift';

export const buyGiftsByIds = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

  type NotificationPayload = {
    sellerId: string;
    collection_name: string;
    number: number;
    price: number;
  };

  const notifications: NotificationPayload[] = [];
  let buyerBalance = 0;

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
      let totalCost = 0;

      for (const gift of gifts) {
        if (
          !gift?.status ||
          gift.status !== GiftStatus.LISTED ||
          !gift.owner ||
          gift.owner.id === buyer.id
        ) {
          throw new Error(`Invalid or unavailable gift ID: ${gift?.id}`);
        }

        const seller = gift.owner;
        const sellPrice = gift.sell_price;
        const sellPriceWithFee = gift.sell_price_with_fee;

        totalCost += sellPriceWithFee;

        buyer.ton_balance -= sellPriceWithFee;
        seller.ton_balance += sellPrice;

        gift.owner = buyer;
        gift.status = externalPurchase ? GiftStatus.SOLD : GiftStatus.UNLISTED;
        gift.sell_price = 0;
        gift.sell_price_with_fee = 0;
        gift.listed_date = null;
        gift.transferred_date = null;

        notifications.push({
          sellerId: seller.id,
          collection_name: gift.collection_name,
          number: gift.number,
          price: sellPrice,
        });

        affectedUsers.set(seller.id, seller);
      }

      if (buyer.ton_balance < 0) {
        throw new Error('Insufficient balance');
      }

      affectedUsers.set(buyer.id, buyer);
      buyerBalance = buyer.ton_balance;

      await manager.save(userRepository.target, [...affectedUsers.values()]);
      await manager.save(giftRepository.target, gifts);

      return {
        success: true,
        bought: gifts.map((g) => g.id),
        total: totalCost,
        external: Boolean(externalPurchase),
      };
    });

    res.status(200).json({
      ...result,
      updated_balance: buyerBalance,
    });

    for (const note of notifications) {
      await botSendMessage(
        note.sellerId,
        `🎉 <b>Your gift ${note.collection_name} #${note.number}</b> was sold. For ${note.price}`,
        'HTML',
      );
    }
  } catch (err: any) {
    console.error('❌ Transaction failed:', err);
    res.status(400).json({ error: err.message || 'Failed to buy gifts' });
  }
};
