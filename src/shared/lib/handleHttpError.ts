import { Response } from 'express';
import { isHttpError } from './httpError';

export function handleHttpError(res: Response, err: unknown, logPrefix: string): void {
  if (isHttpError(err)) {
    res.status(err.statusCode).json({ error: err.message });
  } else {
    console.error(`❌ ${logPrefix}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
