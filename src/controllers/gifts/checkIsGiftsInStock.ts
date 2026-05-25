import type { Request, Response } from 'express';
import {
  checkGiftsStockService,
  GiftStockRequest,
} from '../../services/gifts/checkGiftsStockService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const checkGiftsIsInStock = async (req: Request, res: Response): Promise<void> => {
  const { gift_ids }: { gift_ids: GiftStockRequest[] } = req.body;

  if (!Array.isArray(gift_ids) || gift_ids.length === 0) {
    res.status(400).json({ error: 'gift_ids[] is required and must be non-empty' });
    return;
  }

  try {
    const { available, gifts, unavailable, priceMismatch } = await checkGiftsStockService(gift_ids);

    if (!available) {
      res.status(409).json({
        error: 'Some gifts are not available for purchase',
        unavailable,
        updated_prices: priceMismatch,
      });
      return;
    }

    res.status(200).json({ success: true, gifts });
  } catch (err) {
    handleHttpError(res, err, 'checkGiftsIsInStock');
  }
};
