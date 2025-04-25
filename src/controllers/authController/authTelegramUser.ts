import type { Request, Response } from 'express';
import { checkTelegramInitData } from '../../shared/lib/auth/checkTelegramInitData';
import { userRepository } from '../../database/repositories/userRepository';

export const authTelegramUser = async (req: Request, res: Response) => {
  try {
    const { initData } = req.query;

    if (typeof initData !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid initData' });
    }

    if (initData.length < 10) {
      return res.status(400).json({ error: 'initData too short' });
    }

    const parsed = checkTelegramInitData(
      initData,
      process.env.TELEGRAM_BOT_TOKEN!,
    );

    if (!parsed.user) {
      return res.status(400).json({ error: 'User field missing in initData' });
    }

    // 2. Парсим TelegramUserData
    const rawUser = JSON.parse(parsed.user as string);

    if (!rawUser?.id) {
      return res.status(400).json({ error: 'Invalid Telegram user data' });
    }

    const userData = {
      id: String(rawUser.id),
      username: rawUser.username ?? null,
      first_name: rawUser.first_name ?? null,
      last_name: rawUser.last_name ?? null,
      photo_url: rawUser.photo_url ?? null,
      allows_write_to_pm: rawUser.allows_write_to_pm ?? true,
    };

    const existing = await userRepository.findOneBy({ id: userData.id });

    const savedUser = existing
      ? await userRepository.save({ ...existing, ...userData })
      : await userRepository.save(userRepository.create(userData));

    // 4. Возврат
    return res.status(200).json({ user: savedUser });
  } catch (err) {
    console.warn('❌ Telegram auth failed:', err);
    return res.status(403).json({ error: 'Unauthorized' });
  }
};
