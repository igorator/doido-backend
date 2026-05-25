import type { Request, Response } from 'express';
import { authUserService } from '../../services/user/authUserService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const authTelegramUser = async (req: Request, res: Response): Promise<void> => {
  const telegramUser = req.telegramUser;

  if (!telegramUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await authUserService(telegramUser);
    res.status(200).json({ user });
  } catch (err) {
    handleHttpError(res, err, 'authTelegramUser');
  }
};
