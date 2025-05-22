import { Request, Response } from 'express';

export const checkIsMaintenance = async (_req: Request, res: Response) => {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  res.json({ status: isMaintenance });
};
