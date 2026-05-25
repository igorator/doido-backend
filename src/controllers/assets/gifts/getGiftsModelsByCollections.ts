import { Request, Response } from 'express';
import { getGiftsModelsService } from '../../../services/assets/getGiftsModelsService';
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

export const getGiftsModelsByCollections = async (req: Request, res: Response): Promise<void> => {
  const collections = toCollections(req.query.collections);

  if (collections.length === 0) {
    res.json([]);
    return;
  }

  try {
    const models = await getGiftsModelsService(collections);
    res.json(models);
  } catch (err) {
    handleHttpError(res, err, 'getGiftsModelsByCollections');
  }
};
