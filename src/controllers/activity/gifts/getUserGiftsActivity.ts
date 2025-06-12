import { Request, Response } from 'express';
import { Activity, ActivityItemType } from '../../../models/Activity';
import { AppDataSource } from '../../../database/db';

export const getUserGiftsActivity = async (req: Request, res: Response) => {
  const userId = String(req.params.user_id);
  const skip = parseInt(req.query.skip as string) || 0;
  const take = parseInt(req.query.take as string) || 20;

  try {
    const activityRepo = AppDataSource.getRepository(Activity);

    const [activities, total] = await activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.buyer', 'buyer')
      .leftJoinAndSelect('activity.seller', 'seller')
      .where('activity.item_type = :type', { type: ActivityItemType.GIFT })
      .andWhere('(buyer.id = :userId OR seller.id = :userId)', { userId })
      .orderBy('activity.created_at', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    res.json({
      activities,
      total,
      hasMore: skip + take < total,
    });
  } catch (err) {
    console.error('❌ Ошибка в getUserGiftsActivity:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
