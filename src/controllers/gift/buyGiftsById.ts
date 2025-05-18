import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { botSendMessage } from '../../services/messages/botSendMessage';
import { transferGift } from '../../services/gifts/transferGift';
import { GiftStatus } from '../../models/Gift';

export const buyGiftsByIds = async (req: Request, res: Response) => {
  const telegramUser = (req as any).telegramUser;
  const { gift_ids, externalPurchase } = req.body;

  if (!telegramUser?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!Array.isArray(gift_ids) || gift_ids.length === 0) {
    return res.status(400).json({ error: 'No gift IDs provided' });
  }

  const notifications: {
    sellerId: string;
    collection_name: string;
    number: number;
    price: number;
  }[] = [];

  try {
    const { boughtGifts, updatedBalance } = await AppDataSource.transaction(
      async (manager) => {
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
            gift.status !== GiftStatus.LISTED ||
            !gift.owner ||
            gift.owner.id === buyer.id
          ) {
            throw new Error(`Invalid gift ID: ${gift?.id}`);
          }

          const { owner: seller, sell_price, sell_price_with_fee } = gift;

          totalCost += sell_price_with_fee;
          buyer.ton_balance -= sell_price_with_fee;
          seller.ton_balance += sell_price;

          gift.owner = buyer;
          gift.status = externalPurchase
            ? GiftStatus.SOLD
            : GiftStatus.UNLISTED;
          gift.sell_price = 0;
          gift.sell_price_with_fee = 0;
          gift.listed_date = null;
          gift.transferred_date = null;

          notifications.push({
            sellerId: seller.id,
            collection_name: gift.collection_name,
            number: gift.number,
            price: sell_price,
          });

          affectedUsers.set(seller.id, seller);
        }

        if (buyer.ton_balance < 0) {
          throw new Error('Insufficient balance');
        }

        affectedUsers.set(buyer.id, buyer);

        await manager.save([...affectedUsers.values()]);
        await manager.save(gifts);

        return {
          boughtGifts: gifts,
          updatedBalance: buyer.ton_balance,
        };
      },
    );

    res.status(200).json({
      success: true,
      bought: boughtGifts.map((g) => g.id),
      updated_balance: updatedBalance,
      external: Boolean(externalPurchase),
    });

    if (externalPurchase) {
      await Promise.all(
        boughtGifts.map((gift) =>
          transferGift({
            giftId: gift.id,
            newOwnerId: telegramUser.id,
          }).catch((err) =>
            console.error(`❌ Failed to transfer gift ${gift.id}:`, err),
          ),
        ),
      );
    }

    await Promise.all(
      notifications.map((note) =>
        botSendMessage(
          note.sellerId,
          `🎉 <b>Your gift ${note.collection_name} #${note.number}</b> was sold. For ${note.price}`,
          'HTML',
        ),
      ),
    );
  } catch (err: any) {
    console.error('❌ Transaction failed:', err);
    res.status(400).json({ error: err.message || 'Failed to buy gifts' });
  }
};
