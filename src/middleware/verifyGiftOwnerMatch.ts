import type { RequestHandler } from 'express';
import { giftRepository } from '../database/repositories/giftRepository';
import { handleHttpError } from '../shared/lib/handleHttpError';

export const verifyGiftOwnerMatch: RequestHandler = async (req, res, next) => {
  const telegramUser = req.telegramUser;

  if (!telegramUser?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const giftId = req.params.gift_id;
  if (!giftId) {
    res.status(400).json({ error: 'Gift ID required' });
    return;
  }

  try {
    const gift = await giftRepository.findOne({
      where: { id: giftId },
      relations: ['owner'],
    });

    if (!gift) {
      res.status(404).json({ error: 'Gift not found' });
      return;
    }

    if (!gift.owner || String(gift.owner.id) !== String(telegramUser.id)) {
      res.status(403).json({ error: 'Forbidden: not your gift' });
      return;
    }

    req.verifiedGift = gift;
    next();
  } catch (err) {
    handleHttpError(res, err, 'verifyGiftOwnerMatch');
  }
};
