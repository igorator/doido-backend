import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { userRepository } from '../../database/repositories/userRepository';

dotenv.config();

export const authTelegramUser = async (req: Request, res: Response) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined');
    }

    const query = req.query as Record<string, string>;

    const { hash, ...params } = query;
    if (!hash) {
      return res.status(400).json({ error: 'Missing hash parameter' });
    }

    const dataCheckString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('\n');

    // 2. Генерируем хэш
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(token)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return res.status(403).json({ error: 'Invalid Telegram initData hash' });
    }

    const rawUser = JSON.parse(params.user);
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

    return res.status(200).json({ user: savedUser });
  } catch (err) {
    console.warn('❌ Telegram auth failed:', err);
    return res.status(403).json({ error: 'Unauthorized' });
  }
};
