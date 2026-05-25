import { Request, Response } from 'express';
import { unlistGiftService } from '../../services/gifts/unlistGiftService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const unlistGiftFromSaleById = async (req: Request, res: Response): Promise<void> => {
  const gift = req.verifiedGift!;

  try {
    const updated = await unlistGiftService(gift);

    res.json({
      id: updated.id,
      collection_name: updated.collection_name,
      number: updated.number,
      status: updated.status,
      sell_price: updated.sell_price,
      sell_price_with_fee: updated.sell_price_with_fee,
      listed_date: updated.listed_date,
      owner: updated.owner ? { id: updated.owner.id, username: updated.owner.username } : null,
    });

    console.log(
      `[${new Date().toISOString()}] 📴 ${gift.owner.username} (${gift.owner.id})` +
        ` unlisted ${gift.collection_name} #${gift.number}`,
    );
  } catch (err) {
    handleHttpError(res, err, 'unlistGiftFromSaleById');
  }
};
