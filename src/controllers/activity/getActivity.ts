import { Request, Response } from 'express';
import { activityRepository } from '../../database/repositories/activityRepository';

export const getActivity = async (_req: Request, res: Response) => {
  try {
    const activities = await activityRepository.find({
      order: { created_at: 'DESC' },
      take: 20,
    });

    res.json(activities);
  } catch (err) {
    console.error('❌ Error in getActivity:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
