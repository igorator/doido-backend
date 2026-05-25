import { Request, Response } from 'express';
import { getGiftsActivityService } from '../../../services/activity/getGiftsActivityService';
import { handleHttpError } from '../../../shared/lib/handleHttpError';

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (value) return [value as string];
  return [];
};

export const getGiftsActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      collection,
      model,
      backdrop,
      pattern,
      gift_id,
      min_price,
      max_price,
      skip = '0',
      take = '10',
    } = req.query;

    const skipNum = Math.max(0, Number(skip) || 0);
    const takeNum = Math.min(Math.max(1, Number(take) || 10), 100);
    const giftIdNum = Number(gift_id);

    const result = await getGiftsActivityService({
      collections: toArray(collection),
      models: toArray(model),
      backdrops: toArray(backdrop),
      patterns: toArray(pattern),
      giftNumber: !isNaN(giftIdNum) && gift_id ? giftIdNum : undefined,
      minPrice: min_price ? parseFloat(min_price as string) : undefined,
      maxPrice: max_price ? parseFloat(max_price as string) : undefined,
      skip: skipNum,
      take: takeNum,
    });

    res.json(result);
  } catch (err) {
    handleHttpError(res, err, 'getGiftsActivity');
  }
};
