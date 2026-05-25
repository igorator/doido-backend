import { Request, Response } from 'express';
import { getGiftsPatternsService } from '../../../services/assets/getGiftsPatternsService';
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

export const getGiftsPatterns = async (req: Request, res: Response): Promise<void> => {
  const collections = toCollections(req.query.collections);

  try {
    const patterns = await getGiftsPatternsService(collections);
    res.json(patterns);
  } catch (err) {
    handleHttpError(res, err, 'getGiftsPatterns');
  }
};
