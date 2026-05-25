import { Request, Response } from 'express';
import { getGiftsService } from '../../services/gifts/getGiftsService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (value) return [value as string];
  return [];
};

export const getGifts = async (req: Request, res: Response): Promise<void> => {
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
      skip = 0,
      take = 20,
    } = req.query;

    const result = await getGiftsService({
      collections: toArray(collection),
      models: toArray(model),
      backdrops: toArray(backdrop),
      patterns: toArray(pattern),
      minPrice: min_price as string | undefined,
      maxPrice: max_price as string | undefined,
      sort: String(sort),
      giftNumber: gift_id ? Number(gift_id) : undefined,
      skip: Math.max(0, Number(skip) || 0),
      take: Math.min(Math.max(1, Number(take) || 20), 100),
    });

    res.json(result);
  } catch (err) {
    handleHttpError(res, err, 'getGifts');
  }
};
