import { Request, Response, NextFunction } from 'express';
import { userRepository } from '../database/repositories/userRepository';
import { handleHttpError } from '../shared/lib/handleHttpError';

export async function checkUserNotBanned(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const telegramUser = req.telegramUser;

  if (!telegramUser?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await userRepository.findOneBy({
      id: String(telegramUser.id),
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.is_banned) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    next();
  } catch (err) {
    handleHttpError(res, err, 'checkUserNotBanned');
  }
}
