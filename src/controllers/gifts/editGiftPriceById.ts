import { Request, Response } from 'express';
import { editGiftPriceService } from '../../services/gifts/editGiftPriceService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const editGiftPriceById = async (req: Request, res: Response): Promise<void> => {
  const gift = req.verifiedGift!;
  const rawPrice = req.body.price;

  if (!rawPrice || isNaN(Number(rawPrice))) {
    res.status(400).json({ error: 'Invalid price' });
    return;
  }

  try {
    const updated = await editGiftPriceService({ gift, price: Number(rawPrice) });

    res.json({
      id: updated.id,
      collection_name: updated.collection_name,
      number: updated.number,
      status: updated.status,
      sell_price: updated.sell_price,
      sell_price_with_fee: updated.sell_price_with_fee,
    });
  } catch (err) {
    handleHttpError(res, err, 'editGiftPriceById');
  }
};
