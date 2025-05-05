import { Request, Response } from 'express';
import { activityRepository } from '../../database/repositories/activityRepository';

export const getUserActivity = async (req: Request, res: Response) => {
  const userId = String(req.query.user_id);

  try {
    const activities = await activityRepository.find({
      where: [{ buyer: { id: userId } }, { seller: { id: userId } }],
      order: { created_at: 'DESC' },
      take: 20,
    });

    res.json(activities);
  } catch (err) {
    console.error('❌ Error in getUserActivity:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
