import type { Gift } from '../models/Gift';

declare global {
  namespace Express {
    interface Request {
      telegramUser?: {
        id: number;
        username?: string;
        first_name?: string;
        last_name?: string;
        language_code?: string;
        photo_url?: string;
        allows_write_to_pm?: boolean;
      };
      verifiedGift?: Gift;
    }
  }
}
