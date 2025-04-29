import type { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';

export const BuyGiftById = async (req: Request, res: Response) => {
  try {
    const telegramUser = (req as any).telegramUser;
    const giftId = req.params.gift_id;

    if (!telegramUser || !telegramUser.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!giftId) {
      return res.status(400).json({ error: 'Gift ID is required' });
    }

    const gift = await giftRepository.findOne({
      where: { id: giftId },
      relations: ['owner'],
    });

    if (!gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    if (!gift.is_listed) {
      return res.status(400).json({ error: 'Gift is not listed for sale' });
    }

    if (gift.owner.id === telegramUser.id) {
      return res.status(403).json({ error: 'Cannot buy your own gift' });
    }

    const buyer = await userRepository.findOneBy({
      id: String(telegramUser.id),
    });
    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    const price = gift.sell_price_with_fee;

    if (buyer.ton_balance < price) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    buyer.ton_balance -= price;
    gift.owner.ton_balance += gift.sell_price;

    gift.owner = buyer;
    gift.is_listed = false;
    gift.sell_price = 0;
    gift.sell_price_with_fee = 0;
    gift.listed_date = null;

    await userRepository.save([buyer, gift.owner]);
    await giftRepository.save(gift);

    return res.status(200).json({ success: true, newOwner: buyer.id });
  } catch (err) {
    console.error('❌ Error processing gift purchase:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
