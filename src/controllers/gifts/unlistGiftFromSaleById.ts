import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { GiftStatus } from '../../models/Gift';
import Decimal from 'decimal.js';

export const unlistGiftFromSaleById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { gift_id } = req.params;
  const telegramUser = (req as any).telegramUser;

  try {
    const gift = await giftRepository.findOne({
      where: { id: gift_id },
      relations: ['owner'],
    });

    if (!gift) {
      res.status(404).json({ error: 'Gift not found' });
      return;
    }

    if (!gift.owner || gift.owner.id !== String(telegramUser.id)) {
      console.warn(
        '❌ User tried to unlist a gift that does not belong to them',
      );
      res.status(403).json({ error: 'Forbidden: not your gift' });
      return;
    }

    gift.status = GiftStatus.UNLISTED;
    gift.sell_price = new Decimal(0);
    gift.sell_price_with_fee = new Decimal(0);
    gift.listed_date = null;

    const updatedGift = await giftRepository.save(gift);

    res.json({
      id: updatedGift.id,
      collection_name: updatedGift.collection_name,
      number: updatedGift.number,
      status: updatedGift.status,
      sell_price: updatedGift.sell_price,
      sell_price_with_fee: updatedGift.sell_price_with_fee,
      listed_date: updatedGift.listed_date,
      owner: updatedGift.owner
        ? {
            id: updatedGift.owner.id,
            username: updatedGift.owner.username,
          }
        : null,
    });
  } catch (error) {
    console.error('❌ Ошибка при снятии подарка с продажи:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
