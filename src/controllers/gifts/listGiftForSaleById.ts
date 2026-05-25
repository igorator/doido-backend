import { Request, Response } from 'express';
import { listGiftService } from '../../services/gifts/listGiftService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const listGiftForSaleById = async (req: Request, res: Response): Promise<void> => {
  const { gift_id } = req.params;
  const rawPrice = req.body.price;

  if (!rawPrice || isNaN(Number(rawPrice))) {
    res.status(400).json({ error: 'Invalid price' });
    return;
  }

  try {
    const { gift, owner } = await listGiftService({
      giftId: gift_id,
      ownerId: String(req.telegramUser!.id),
      price: Number(rawPrice),
    });

    res.json({
      id: gift.id,
      collection_name: gift.collection_name,
      number: gift.number,
      status: gift.status,
      sell_price: gift.sell_price,
      sell_price_with_fee: gift.sell_price_with_fee,
      listed_date: gift.listed_date,
      free_listings_used: gift.free_listings_used,
      owner: { id: owner.id, username: owner.username },
    });
  } catch (err) {
    handleHttpError(res, err, 'listGiftForSaleById');
  }
};
