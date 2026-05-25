import type { Request, Response } from 'express';
import { updateUserReferralService } from '../../services/user/updateUserReferralService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const updateUserReferral = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.id;
  const { referred_by } = req.body;

  if (!userId || !referred_by) {
    res.status(400).json({ error: 'Missing userId or referred_by' });
    return;
  }

  if (userId !== String(req.telegramUser?.id)) {
    res.status(403).json({ error: 'Forbidden: user ID mismatch' });
    return;
  }

  try {
    const result = await updateUserReferralService(userId, referred_by);

    if ('user' in result) {
      res.status(200).json(result.user);
      return;
    }

    res.status(200).json({ skipped: true });
  } catch (err) {
    handleHttpError(res, err, 'updateUserReferral');
  }
};
