import type { Request, Response, NextFunction } from 'express';
import { checkTelegramInitData } from '../shared/lib/auth/verifyTelegramHashByInitData';

export function verifyTelegramHashMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN not defined');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const params = req.query as Record<string, string>;
  const { valid, reason, user } = checkTelegramInitData(params, token);

  if (!valid || !user) {
    console.warn('❌ Invalid Telegram initData:', reason);
    return res.status(403).json({ error: 'Unauthorized' });
  }

  (req as any).telegramUser = user;

  next();
}
