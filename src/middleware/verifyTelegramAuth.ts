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

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Telegram ')) {
    console.warn('❌ Missing or invalid Authorization header');
    return res.status(401).json({ error: 'Unauthorized: missing auth header' });
  }

  const initDataRaw = authHeader.slice('Telegram '.length).trim();
  const initDataParams = new URLSearchParams(initDataRaw);
  const params: Record<string, string> = {};

  initDataParams.forEach((value, key) => {
    params[key] = value;
  });

  const { valid, reason, user } = checkTelegramInitData(params, token);

  if (!valid || !user) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('❌ Invalid Telegram initData:', reason);
    }
    return res.status(401).json({ error: 'Unauthorized: invalid initData' });
  }

  (req as any).telegramUser = user;

  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Authenticated user:', user);
  }

  next();
}
