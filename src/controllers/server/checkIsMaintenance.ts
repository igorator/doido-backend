import { Request, Response } from 'express';
import { getMaintenanceStatusService } from '../../services/server/getMaintenanceStatusService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const checkIsMaintenance = async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = await getMaintenanceStatusService();
    res.json({ status });
  } catch (err) {
    handleHttpError(res, err, 'checkIsMaintenance');
  }
};
