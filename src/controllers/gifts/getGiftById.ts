import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { GiftStatus } from '../../models/Gift';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const getGiftById = async (req: Request, res: Response): Promise<void> => {
  const { gift_id } = req.params;

  if (!gift_id) {
    res.status(400).json({ error: 'Gift ID is required' });
    return;
  }

  try {
    const gift = await giftRepository.findOne({
      where: {
        id: gift_id,
        status: GiftStatus.LISTED,
      },
      relations: ['owner'],
    });

    if (!gift) {
      res.status(404).json({ error: 'Gift not found or not listed' });
      return;
    }

    res.json({
      ...gift.toJSON(),
      owner: gift.owner ? { id: gift.owner.id, username: gift.owner.username } : null,
    });
  } catch (err) {
    handleHttpError(res, err, 'getGiftById');
  }
};
