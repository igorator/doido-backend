import type { Request, Response } from 'express';
import { In } from 'typeorm';
import { giftRepository } from '../../database/repositories/giftRepository';
import { GiftStatus } from '../../models/Gift';
import Decimal from 'decimal.js';

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
    const priceMismatch: { id: string; actual_price: number }[] = [];

    for (const { id, sell_price_with_fee } of gift_ids) {
      const giftInDb = dbGifts.find((g) => g.id === id);

      if (!giftInDb || giftInDb.status !== GiftStatus.LISTED) {
        unavailable.push(id);
      } else if (!giftInDb.sell_price_with_fee.eq(sell_price_with_fee)) {
        priceMismatch.push({
          id,
          actual_price: giftInDb.sell_price_with_fee.toNumber(),
        });
      }
    }

    if (unavailable.length || priceMismatch.length) {
      res.status(409).json({
        error: 'Some gifts are not available for purchase',
        unavailable,
        updated_prices: priceMismatch,
      });
      return;
    }

    res.status(200).json({ success: true, gifts: dbGifts });
  } catch (error) {
    console.error('❌ Error checking gift stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
