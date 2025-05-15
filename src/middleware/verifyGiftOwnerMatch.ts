import type { RequestHandler } from 'express';
import { giftRepository } from '../database/repositories/giftRepository';

export const verifyGiftOwnerMatch: RequestHandler = async (req, res, next) => {
  const telegramUser = (req as any).telegramUser;

  if (!telegramUser || !telegramUser.id) {
    console.error('❌ No authenticated user found in request');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const giftId = req.params.gift_id;
  if (!giftId) {
    console.error('❌ No gift_id in request params');
    res.status(400).json({ error: 'Gift ID required' });
    return;
  }

  try {
    const gift = await giftRepository.findOne({
      where: { id: giftId },
      relations: ['owner'],
    });

    if (!gift) {
      console.warn('❌ Gift not found');
      res.status(404).json({ error: 'Gift not found' });
      return;
    }

    if (!gift.owner || String(gift.owner.id) !== String(telegramUser.id)) {
      console.warn('❌ Attempt to operate on a gift not owned by user');
      res.status(403).json({ error: 'Forbidden: not your gift' });
      return;
    }

    next();
  } catch (err) {
    console.error('❌ Error during gift owner verification:', err);
    res.status(500).json({ error: 'Server error verifying gift owner' });
  }
};
