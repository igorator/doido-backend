import { Request, Response } from 'express';
import { getGiftsCollectionsService } from '../../../services/assets/getGiftsCollectionsService';
import { handleHttpError } from '../../../shared/lib/handleHttpError';

export const getGiftsCollections = async (_req: Request, res: Response): Promise<void> => {
  try {
    const collections = await getGiftsCollectionsService();
    res.json(collections);
  } catch (err) {
    handleHttpError(res, err, 'getGiftsCollections');
  }
};
