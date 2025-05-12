import type { Request, Response } from 'express';
import { In } from 'typeorm';
import { giftRepository } from '../../database/repositories/giftRepository';

export const checkIsGiftInStock = async (req: Request, res: Response) => {
  const { gift_id, gift_ids } = req.body;

  if (!gift_id && !Array.isArray(gift_ids)) {
    return res.status(400).json({ error: 'gift_id or gift_ids[] required' });
  }

  try {
    if (gift_id) {
      const gift = await giftRepository.findOne({
        where: { id: gift_id, is_listed: true },
        relations: ['owner'],
      });

      if (!gift) {
        return res
          .status(404)
          .json({ error: `Gift ${gift_id} not found or not listed` });
      }

      return res.status(200).json({ success: true, gifts: [gift] });
    }

    const gifts = await giftRepository.find({
      where: {
        id: In(gift_ids),
        is_listed: true,
      },
      relations: ['owner'],
    });

    const foundIds = gifts.map((g) => g.id);
    const missingIds = gift_ids.filter((id: string) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      return res.status(404).json({
        error: `Some gifts not found or not listed`,
        missing: missingIds,
      });
    }

    return res.status(200).json({ success: true, gifts });
  } catch (error) {
    console.error('❌ Error checking gift stock:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
