import { Request, Response } from 'express';
import { activityRepository } from '../../database/repositories/activityRepository';

export const getUserActivity = async (req: Request, res: Response) => {
  const userId = String(req.query.user_id);
  const type = req.query.type as string | undefined;

  try {
    const where = [];

    if (type) {
      where.push({ buyer: { id: userId }, type });
      where.push({ seller: { id: userId }, type });
    } else {
      where.push({ buyer: { id: userId } });
      where.push({ seller: { id: userId } });
    }

    const activities = await activityRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: 20,
    });

    res.json(activities);
  } catch (err) {
    console.error('❌ Error in getUserActivity:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
