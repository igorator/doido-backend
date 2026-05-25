import { Request, Response } from 'express';
import { getUserGiftsActivityService } from '../../../services/activity/getUserGiftsActivityService';
import { handleHttpError } from '../../../shared/lib/handleHttpError';

export const getUserGiftsActivity = async (req: Request, res: Response): Promise<void> => {
  const userId = String(req.params.user_id);
  const skip = Math.max(0, parseInt(req.query.skip as string) || 0);
  const take = Math.min(Math.max(1, parseInt(req.query.take as string) || 20), 100);

  try {
    const result = await getUserGiftsActivityService(userId, skip, take);
    res.json(result);
  } catch (err) {
    handleHttpError(res, err, 'getUserGiftsActivity');
  }
};
