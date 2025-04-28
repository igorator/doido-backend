import type { Request, Response } from 'express';
import { userRepository } from '../../database/repositories/userRepository';

export const authTelegramUser = async (req: Request, res: Response) => {
  try {
    const telegramUser = (req as any).telegramUser;
    if (!telegramUser) {
      console.warn('❌ Telegram user not found in request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userData = {
      id: String(telegramUser.id),
      username: telegramUser.username ?? null,
      first_name: telegramUser.first_name ?? null,
      last_name: telegramUser.last_name ?? null,
      photo_url: telegramUser.photo_url ?? null,
      allows_write_to_pm: telegramUser.allows_write_to_pm ?? false,
    };

    const existingUser = await userRepository.findOneBy({ id: userData.id });

    let savedUser;
    if (existingUser) {
      savedUser = await userRepository.save({
        ...existingUser,
        ...userData,
      });
    } else {
      const newUser = userRepository.create(userData);
      savedUser = await userRepository.save(newUser);
    }

    return res.status(200).json({ user: savedUser });
  } catch (err) {
    console.error('❌ Telegram auth error:', err);
    return res
      .status(500)
      .json({ error: (err as Error).message || 'Server error' });
  }
};
