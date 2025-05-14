import { Request, Response } from 'express';
import { activityRepository } from '../../database/repositories/activityRepository';

export const getActivity = async (req: Request, res: Response) => {
  try {
    const skip = Number(req.query.skip) || 0;
    const take = Number(req.query.take) || 20;

    const [activities, total] = await activityRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip,
      take,
    });

    const hasMore = skip + take < total;

    res.json({
      activities,
      total,
      hasMore,
    });
  } catch (err) {
    console.error('❌ Error in getActivity:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
