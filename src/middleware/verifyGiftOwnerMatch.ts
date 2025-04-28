import type { Request, Response, NextFunction } from 'express';
import { giftRepository } from '../database/repositories/giftRepository';

export async function verifyGiftOwnerMatch(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const telegramUser = (req as any).telegramUser;

  if (!telegramUser || !telegramUser.id) {
    console.error('❌ No authenticated user found in request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const giftId = req.params.gift_id;
  if (!giftId) {
    console.error('❌ No gift_id in request params');
    return res.status(400).json({ error: 'Gift ID required' });
  }

  try {
    const gift = await giftRepository.findOne({
      where: { id: giftId },
      relations: ['owner'],
    });

    if (!gift) {
      console.warn('❌ Gift not found');
      return res.status(404).json({ error: 'Gift not found' });
    }

    if (!gift.owner || String(gift.owner.id) !== String(telegramUser.id)) {
      console.warn('❌ Attempt to operate on a gift not owned by user');
      return res.status(403).json({ error: 'Forbidden: not your gift' });
    }

    next();
  } catch (err) {
    console.error('❌ Error during gift owner verification:', err);
    return res.status(500).json({ error: 'Server error verifying gift owner' });
  }
}
