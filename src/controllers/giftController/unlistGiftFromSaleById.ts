import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { Gift } from '../../models/Gift';

export const unlistGiftFromSaleById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const gift = await giftRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!gift) {
      res.status(404).json({ error: 'Gift not found' });
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

    res.json(updatedGift);
  } catch (error) {
    console.error('❌ Ошибка при снятии подарка с продажи:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
