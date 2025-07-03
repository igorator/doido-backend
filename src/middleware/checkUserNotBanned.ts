import { Request, Response, NextFunction } from 'express';
import { userRepository } from '../database/repositories/userRepository';

export async function checkUserNotBanned(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const telegramUser = (req as any).telegramUser;

  if (!telegramUser?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await userRepository.findOneBy({
      id: telegramUser.id,
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.is_banned) {
      console.warn(`🚫 Заблокированный пользователь: ${user.username}`);
      res.status(403).json({ error: 'сори ты в бане, без негатива.' });
      return;
    }

    next();
  } catch (err) {
    console.error('❌ Ошибка при проверке is_banned:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
