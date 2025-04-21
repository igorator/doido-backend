import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const BOT_TOKEN = process.env.BOT_TOKEN as string;

export function verifyTelegramHash(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log(req.body);
    const data = { ...req.body };
    const receivedHash = data.hash;
    delete data.hash;

    const sortedData = Object.keys(data)
      .sort()
      .map((key) => `${key}=${data[key]}`)
      .join('\n');

    const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
    const generatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedData)
      .digest('hex');

    if (generatedHash !== receivedHash) {
      console.warn('⚠️ Hash mismatch!');
      return res.status(401).json({ error: 'Invalid hash' });
    }

    next();
  } catch (err) {
    console.error('❌ Telegram hash validation error:', err);
    res.status(400).json({ error: 'Invalid auth payload' });
  }
}
