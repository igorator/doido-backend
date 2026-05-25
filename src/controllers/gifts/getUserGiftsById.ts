import { Request, Response } from 'express';
import { getUserGiftsService } from '../../services/gifts/getUserGiftsService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (value) return [value as string];
  return [];
};

export const getGiftsByUserId = async (req: Request, res: Response): Promise<void> => {
  const telegramUser = req.telegramUser;
  if (!telegramUser?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const {
      collection,
      model,
      backdrop,
      pattern,
      min_price,
      max_price,
      sort = 'latest',
      gift_id,
    } = req.query;

    const result = await getUserGiftsService({
      userId: String(telegramUser.id),
      collections: toArray(collection),
      models: toArray(model),
      backdrops: toArray(backdrop),
      patterns: toArray(pattern),
      minPrice: min_price as string | undefined,
      maxPrice: max_price as string | undefined,
      sort: String(sort),
      giftNumber: gift_id ? Number(gift_id) : undefined,
    });

    res.json(result);
  } catch (err) {
    handleHttpError(res, err, 'getUserGiftsById');
  }
};
