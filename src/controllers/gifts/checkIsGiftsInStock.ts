import type { Request, Response } from 'express';
import { In } from 'typeorm';
import { giftRepository } from '../../database/repositories/giftRepository';
import { GiftStatus } from '../../models/Gift';

export const checkGiftsIsInStock = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    gift_ids,
  }: { gift_ids: { id: string; sell_price_with_fee: number }[] } = req.body;

  if (!Array.isArray(gift_ids) || gift_ids.length === 0) {
    res
      .status(400)
      .json({ error: 'gift_ids[] is required and must be non-empty' });
    return;
  }

  try {
    const ids = gift_ids.map((g) => g.id);
    const dbGifts = await giftRepository.find({
      where: { id: In(ids) },
      relations: ['owner'],
    });

    const unavailable: string[] = [];
    const priceMismatch: string[] = [];

    for (const { id, sell_price_with_fee } of gift_ids) {
      const dbGift = dbGifts.find((g) => g.id === id);

      if (!dbGift || dbGift.status !== GiftStatus.LISTED) {
        unavailable.push(id);
      } else if (dbGift.sell_price_with_fee !== sell_price_with_fee) {
        priceMismatch.push(id);
      }
    }

    if (unavailable.length || priceMismatch.length) {
      res.status(409).json({
        error: 'Some gifts are not available for purchase',
        unavailable,
        price_mismatch: priceMismatch,
      });
      return;
    }

    res.status(200).json({ success: true, gifts: dbGifts });
  } catch (error) {
    console.error('❌ Error checking gift stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
