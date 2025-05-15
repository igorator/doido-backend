import type { Request, Response } from 'express';
import { userRepository } from '../../database/repositories/userRepository';

export const authTelegramUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const telegramUser = (req as any).telegramUser;

    if (!telegramUser) {
      console.warn('❌ Telegram user not found in request');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userData = {
      ...telegramUser,
      id: String(telegramUser.id),
    };

    await userRepository.upsert(userData, ['id']);
    const user = await userRepository.findOneBy({ id: userData.id });

    res.status(200).json({ user });
  } catch (err) {
    console.error('❌ Telegram auth error:', err);
    res.status(500).json({
      error: (err as Error).message || 'Server error',
    });
  }
};
