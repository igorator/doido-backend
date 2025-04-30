import type { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';

export const BuyGiftsByIds = async (req: Request, res: Response) => {
  try {
    const telegramUser = (req as any).telegramUser;
    const { gift_ids, externalPurchase } = req.body;

    if (!telegramUser || !telegramUser.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!Array.isArray(gift_ids) || gift_ids.length === 0) {
      return res.status(400).json({ error: 'No gift IDs provided' });
    }

    const buyer = await userRepository.findOneBy({
      id: String(telegramUser.id),
    });

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    const gifts = await giftRepository.find({
      where: gift_ids.map((id) => ({ id })),
      relations: ['owner'],
    });

    let totalCost = 0;
    for (const gift of gifts) {
      if (!gift) return res.status(404).json({ error: 'Gift not found' });
      if (!gift.is_listed)
        return res.status(400).json({ error: `Gift ${gift.id} is not listed` });
      if (gift.owner.id === buyer.id)
        return res
          .status(403)
          .json({ error: `Cannot buy your own gift ${gift.id}` });

      totalCost += gift.sell_price_with_fee;
    }

    if (buyer.ton_balance < totalCost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    for (const gift of gifts) {
      buyer.ton_balance -= gift.sell_price_with_fee;
      gift.owner.ton_balance += gift.sell_price;

      gift.owner = buyer;
      gift.is_listed = false;
      gift.sell_price = 0;
      gift.sell_price_with_fee = 0;
      gift.listed_date = null;
    }

    await userRepository.save([buyer, ...gifts.map((g) => g.owner)]);
    await giftRepository.save(gifts);

    return res
      .status(200)
      .json({ success: true, bought: gifts.map((g) => g.id) });
  } catch (err) {
    console.error('❌ Error processing gift purchase:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
