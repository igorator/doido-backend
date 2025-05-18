import type { Request, Response } from 'express';
import {
  updateUserReferral,
  AlreadyReferredError,
  MutualReferralError,
  SelfReferralError,
  UserNotFoundError,
} from '../../services/user/referral/updateUserReferral';

export const updateUserReferralController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.params.id;
  const { referred_by } = req.body;

  console.log('[PATCH referral] Params userId:', userId);
  console.log('[PATCH referral] Body referred_by:', referred_by);

  if (!userId || !referred_by) {
    res.status(400).json({ error: 'Missing userId or referred_by' });
    return;
  }

  const telegramUserId = String((req as any).telegramUser?.id);
  if (userId !== telegramUserId) {
    res.status(403).json({ error: 'Forbidden: user ID mismatch' });
    return;
  }

  try {
    const updatedUser = await updateUserReferral(userId, referred_by);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('❌ Referral update failed:', err);

    if (err instanceof SelfReferralError) {
      res.status(409).json({ error: 'User cannot refer themselves' });
      return;
    }

    if (err instanceof MutualReferralError) {
      res.status(409).json({ error: 'Mutual referral is not allowed' });
      return;
    }

    if (err instanceof AlreadyReferredError) {
      res.status(409).json({ error: 'User already has a referrer' });
      return;
    }

    if (err instanceof UserNotFoundError) {
      res.status(404).json({ error: 'User or referrer not found' });
      return;
    }

    res.status(500).json({ error: 'Internal Server Error' });
  }
};
