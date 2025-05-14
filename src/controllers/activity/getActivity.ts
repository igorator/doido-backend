import { Request, Response } from 'express';
import { activityRepository } from '../../database/repositories/activityRepository';

export const getActivity = async (req: Request, res: Response) => {
  try {
    const skip = Number(req.query.skip) || 0;
    const take = Number(req.query.take) || 20;
    const type = req.query.type as string | undefined;

    const queryOptions: any = {
      order: { created_at: 'DESC' },
      skip,
      take,
    };

    if (type) {
      queryOptions.where = { type };
    }

    const [activities, total] = await activityRepository.findAndCount(
      queryOptions,
    );

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
