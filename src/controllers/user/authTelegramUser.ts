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

    const userId = String(telegramUser.id);
    const existingUser = await userRepository.findOneBy({ id: userId });

    if (existingUser) {
      await userRepository.update(userId, {
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        language_code: telegramUser.language_code,
        photo_url: telegramUser.photo_url,
        allows_write_to_pm: telegramUser.allows_write_to_pm,
      });
    } else {
      console.log(
        `👤 [NEW USER] id: ${userId} | username: ${
          telegramUser.username || 'hidden'
        }`,
      );

      await userRepository.insert({
        id: userId,
        username: telegramUser.username || 'hidden',
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        language_code: telegramUser.language_code,
        photo_url: telegramUser.photo_url,
        allows_write_to_pm: telegramUser.allows_write_to_pm,
        ton_balance: 0.0,
        total_market_amount: 0.0,
      });
    }

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['referred_by', 'referred_users'],
    });

    if (!user) {
      res.status(404).json({ error: 'User not found after upsert' });
      return;
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('❌ Telegram auth error:', err);
    res.status(500).json({
      error: (err as Error).message || 'Server error',
    });
  }
};
