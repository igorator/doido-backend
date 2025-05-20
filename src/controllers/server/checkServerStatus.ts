import { Request, Response } from 'express';

export const checkServerStatus = async (_req: Request, res: Response) => {
  res.sendStatus(200);
};
