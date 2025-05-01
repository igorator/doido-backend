import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';

export const listGiftForSaleById = async (req: Request, res: Response) => {
  const { gift_id } = req.params;
  const { price, price_with_fee } = req.body;
  const telegramUser = (req as any).telegramUser;

  console.log(price, price_with_fee);

  if (!price || isNaN(price)) {
    return res.status(400).json({ error: 'Invalid price' });
  }

  try {
    const gift = await giftRepository.findOne({
      where: { id: gift_id },
      relations: ['owner'],
    });

    if (!gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    console.log(gift.owner.id);
    console.log(telegramUser.id);

    // 🚨 Критичная проверка: что подарок принадлежит этому юзеру
    if (!gift.owner || gift.owner.id !== String(telegramUser.id)) {
      console.warn('❌ User tried to list a gift that does not belong to them');
      return res.status(403).json({ error: 'Forbidden: not your gift' });
    }

    gift.is_listed = true;
    gift.sell_price = Number(price);
    gift.sell_price_with_fee = Number(price_with_fee);
    gift.listed_date = new Date();

    const updatedGift = await giftRepository.save(gift);

    if (updatedGift.owner) {
      delete updatedGift.owner.gifts;
    }

    return res.json({
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
    console.error('❌ Ошибка при выставлении подарка на продажу:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
