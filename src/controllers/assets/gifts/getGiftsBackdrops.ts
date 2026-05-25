import { Request, Response } from 'express';
import { getGiftsBackdropsService } from '../../../services/assets/getGiftsBackdropsService';
import { handleHttpError } from '../../../shared/lib/handleHttpError';

const toCollections = (param: unknown): string[] => {
  if (Array.isArray(param)) return (param as string[]).map((c) => c.trim()).filter(Boolean);
  if (typeof param === 'string')
    return param
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  return [];
};

export const getGiftsBackdrops = async (req: Request, res: Response): Promise<void> => {
  const collections = toCollections(req.query.collections);

  try {
    const backdrops = await getGiftsBackdropsService(collections);
    res.json(backdrops);
  } catch (err) {
    handleHttpError(res, err, 'getGiftsBackdrops');
  }
};
