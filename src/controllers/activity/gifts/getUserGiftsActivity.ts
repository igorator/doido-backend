import { Request, Response } from 'express';
import { Activity, ActivityItemType } from '../../../models/Activity';
import { AppDataSource } from '../../../database/db';

export const getUserGiftsActivity = async (req: Request, res: Response) => {
  const userId = String(req.params.user_id);
  const skip = parseInt(req.query.skip as string) || 0;
  const take = parseInt(req.query.take as string) || 20;

  try {
    const activityRepo = AppDataSource.getRepository(Activity);

    // Сначала просто считаем total без JOIN
    const total = await activityRepo
      .createQueryBuilder('activity')
      .where('activity.item_type = :type', { type: ActivityItemType.GIFT })
      .andWhere('(activity.buyerId = :userId OR activity.sellerId = :userId)', {
        userId,
      })
      .getCount();

    // Потом достаём данные
    const activities = await activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.buyer', 'buyer')
      .leftJoinAndSelect('activity.seller', 'seller')
      .where('activity.item_type = :type', { type: ActivityItemType.GIFT })
      .andWhere('(activity.buyerId = :userId OR activity.sellerId = :userId)', {
        userId,
      })
      .orderBy('activity.created_at', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

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
