import type { Request, Response } from 'express';

import { userRepository } from '../../database/repositories/userRepository';
import { checkTelegramInitData } from '../../shared/lib/auth/checkTelegramInitData';

export const authTelegramUser = async (req: Request, res: Response) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not defined');

    const params = req.query as Record<string, string>;
    const { valid, reason, user } = checkTelegramInitData(params, token);

    if (!valid || !user) {
      console.warn('❌ Invalid initData:', reason);
      return res.status(403).json({ error: 'Invalid Telegram auth' });
    }

    const userData = {
      id: String(user.id),
      username: user.username ?? null,
      first_name: user.first_name ?? null,
      last_name: user.last_name ?? null,
      photo_url: user.photo_url ?? null,
      allows_write_to_pm: user.allows_write_to_pm ?? true,
    };

    const existing = await userRepository.findOneBy({ id: userData.id });

    const savedUser = existing
      ? await userRepository.save({ ...existing, ...userData })
      : await userRepository.save(userRepository.create(userData));

    return res.status(200).json({ user: savedUser });
  } catch (err) {
    console.warn('❌ Telegram auth error:', err);
    return res.status(403).json({ error: 'Unauthorized' });
  }
};
