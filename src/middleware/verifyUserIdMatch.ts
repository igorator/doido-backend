import type { Request, Response, NextFunction } from 'express';

export function verifyUserIdMatch(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const telegramUser = (req as any).telegramUser;

  if (!telegramUser || !telegramUser.id) {
    console.error('❌ No authenticated user found in request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const requestUserId =
    req.params.user_id || req.body?.user_id || req.query?.user_id;

  if (requestUserId && Number(requestUserId) !== telegramUser.id) {
    console.warn("❌ Attempt to operate on another user's data detected");
    return res.status(403).json({ error: 'Forbidden: user ID mismatch' });
  }

  next();
}
