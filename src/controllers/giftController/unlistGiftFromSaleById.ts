import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { Gift } from '../../models/Gift';

export const unlistGiftFromSaleById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const telegramUser = (req as any).telegramUser;

  try {
    const gift = await giftRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!gift) {
      res.status(404).json({ error: 'Gift not found' });
      return;
    }

    if (!gift.owner || gift.owner.id !== telegramUser.id) {
      console.warn(
        '❌ User tried to unlist a gift that does not belong to them',
      );
      res.status(403).json({ error: 'Forbidden: not your gift' });
      return;
    }

    gift.is_listed = false;
    gift.sell_price = 0;
    gift.sell_price_with_fee = 0;
    gift.listed_date = null;

    const updatedGift: Gift = await giftRepository.save(gift);

    if (updatedGift.owner) {
      delete (updatedGift.owner as any).gifts;
    }

    res.json({
      id: updatedGift.id,
      collection_name: updatedGift.collection_name,
      number: updatedGift.number,
      is_listed: updatedGift.is_listed,
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
