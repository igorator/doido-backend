import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { Gift, GiftStatus } from '../../models/Gift';

export const getGiftById = async (req: Request, res: Response) => {
  const { gift_id } = req.params;

  if (!gift_id) {
    res.status(400).json({ error: 'Gift ID is required' });
    return;
  }

  try {
    const giftRepo = AppDataSource.getRepository(Gift);

    const gift = await giftRepo.findOne({
      where: {
        id: gift_id,
        status: GiftStatus.LISTED,
      },
    });

    if (!gift) {
      res.status(404).json({ error: 'Gift not found or not listed' });
      return;
    }

    res.json({
      ...gift.toJSON(),
      owner: gift.owner
        ? { id: gift.owner.id, username: gift.owner.username }
        : null,
    });
    return;
  } catch (err) {
    console.error('❌ Error fetching gift:', err);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
};
