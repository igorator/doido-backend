import type { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { AppDataSource } from '../../database/db';

export const BuyGiftsByIds = async (req: Request, res: Response) => {
  const telegramUser = (req as any).telegramUser;
  const { gift_ids, externalPurchase } = req.body;

  if (!telegramUser || !telegramUser.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!Array.isArray(gift_ids) || gift_ids.length === 0) {
    return res.status(400).json({ error: 'No gift IDs provided' });
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const buyer = await queryRunner.manager.findOneByOrFail(
      userRepository.target,
      { id: String(telegramUser.id) },
    );

    const gifts = await queryRunner.manager.find(giftRepository.target, {
      where: gift_ids.map((id) => ({ id })),
      relations: ['owner'],
    });

    // Validate gifts
    let totalCost = 0;
    for (const gift of gifts) {
      if (!gift) {
        throw new Error('Gift not found');
      }
      if (!gift.is_listed) {
        throw new Error(`Gift ${gift.id} is not listed`);
      }
      if (gift.owner.id === buyer.id) {
        throw new Error(`Cannot buy your own gift ${gift.id}`);
      }

      totalCost += gift.sell_price_with_fee;
    }

    if (buyer.ton_balance < totalCost) {
      throw new Error('Insufficient balance');
    }

    const affectedUsers = new Map<string, typeof buyer>();

    for (const gift of gifts) {
      const seller = gift.owner;

      buyer.ton_balance -= gift.sell_price_with_fee;
      seller.ton_balance += gift.sell_price;

      gift.owner = buyer;
      gift.is_listed = false;
      gift.sell_price = 0;
      gift.sell_price_with_fee = 0;
      gift.listed_date = null;

      affectedUsers.set(seller.id, seller);
    }

    affectedUsers.set(buyer.id, buyer);

    // Save users and gifts
    await queryRunner.manager.save(
      userRepository.target,
      Array.from(affectedUsers.values()),
    );
    await queryRunner.manager.save(giftRepository.target, gifts);

    await queryRunner.commitTransaction();

    return res.status(200).json({
      success: true,
      bought: gifts.map((g) => g.id),
      total: totalCost,
      external: Boolean(externalPurchase),
    });
  } catch (err: any) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Transaction failed:', err);
    return res
      .status(400)
      .json({ error: err.message || 'Failed to buy gifts' });
  } finally {
    await queryRunner.release();
  }
};
