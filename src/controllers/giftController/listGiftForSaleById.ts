import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';

const listGiftForSaleService = async (
  id: string,
  price: number,
  sell_price_with_fee: number,
) => {
  const gift = await giftRepository.findOne({
    where: { id },
    relations: ['owner'],
  });

  if (!gift) return null;

  gift.is_listed = true;
  gift.sell_price = price;
  gift.sell_price_with_fee = sell_price_with_fee;
  gift.listed_date = new Date();

  const updatedGift = await giftRepository.save(gift);

  if (updatedGift.owner) {
    delete updatedGift.owner.gifts;
  }

  return updatedGift;
};

// Контроллер
export const listGiftForSaleById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { price, price_with_fee } = req.body;

  if (!price || isNaN(price)) {
    return res.status(400).json({ error: 'Invalid price' });
  }

  try {
    const gift = await listGiftForSaleService(
      id,
      Number(price),
      Number(price_with_fee),
    );

    if (!gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    return res.json({
      id: gift.id,
      collection_name: gift.collection_name,
      number: gift.number,
      is_listed: gift.is_listed,
      sell_price: gift.sell_price,
      sell_price_with_fee: gift.sell_price_with_fee,
      listed_date: gift.listed_date,
      owner: gift.owner
        ? {
            id: gift.owner.id,
            username: gift.owner.username,
          }
        : null,
    });
  } catch (error) {
    console.error('❌ Ошибка при выставлении подарка на продажу:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
