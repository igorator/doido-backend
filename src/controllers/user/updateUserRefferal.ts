import type { Request, Response } from 'express';
import {
  UserService,
  AlreadyReferredError,
  MutualReferralError,
  SelfReferralError,
  UserNotFoundError,
} from '../../services/user/referral/updateUserReferral';

export const updateUserReferral = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { referred_by } = req.body;

  if (!userId || !referred_by) {
    return res.status(400).json({ error: 'Missing userId or referred_by' });
  }

  try {
    const updatedUser = await UserService.updateUserReferral(
      userId,
      referred_by,
    );
    return res.status(200).json(updatedUser);
  } catch (err) {
    console.error('❌ Referral update failed:', err);

    if (err instanceof SelfReferralError) {
      return res.status(409).json({ error: 'User cannot refer themselves' });
    }

    if (err instanceof MutualReferralError) {
      return res.status(409).json({ error: 'Mutual referral is not allowed' });
    }

    if (err instanceof AlreadyReferredError) {
      return res.status(409).json({ error: 'User already has a referrer' });
    }

    if (err instanceof UserNotFoundError) {
      return res.status(404).json({ error: 'User or referrer not found' });
    }

    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
