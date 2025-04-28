import type { Request, Response, NextFunction } from 'express';
import { checkTelegramInitData } from '../shared/lib/auth/verifyTelegramHashByInitData';

export function verifyTelegramAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is not defined');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const params = req.query as Record<string, string>;
  const { valid, reason, user } = checkTelegramInitData(params, token);

  if (!valid || !user) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('❌ Invalid Telegram initData:', reason);
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  (req as any).telegramUser = {
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    allows_write_to_pm: user.allows_write_to_pm,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Authenticated user:', (req as any).telegramUser);
  }

  next();
}
