import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { AppSettings } from '../../models/AppSettings';

export const checkIsMaintenance = async (_req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(AppSettings);

    const settings = await repo.findOne({
      where: { id: 1 },
    });

    res.json({ status: settings?.is_maintenance ?? false });
  } catch (err) {
    console.error('❌ Failed to check maintenance status:', err);
    res.status(500).json({ error: 'Failed to check maintenance status' });
  }
};
