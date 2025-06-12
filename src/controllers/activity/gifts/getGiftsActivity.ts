import { Request, Response } from 'express';
import { AppDataSource } from '../../../database/db';
import { Activity, ActivityItemType } from '../../../models/Activity';

export const getGiftsActivity = async (req: Request, res: Response) => {
  try {
    const {
      collection,
      model,
      backdrop,
      pattern,
      gift_id,
      min_price,
      max_price,
      skip = '0',
      take = '10',
    } = req.query;

    const skipNum = Number(skip);
    const takeNum = Number(take);

    const normalizeArray = (value: any): string[] =>
      Array.isArray(value) ? value : value ? [value] : [];

    const collections = normalizeArray(collection);
    const models = normalizeArray(model);
    const backdrops = normalizeArray(backdrop);
    const patterns = normalizeArray(pattern);

    const activityRepo = AppDataSource.getRepository(Activity);
    const qb = activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.seller', 'seller')
      .leftJoinAndSelect('activity.buyer', 'buyer')
      .where('activity.item_type = :itemType', {
        itemType: ActivityItemType.GIFT,
      });

    // 🎯 Фильтры
    if (collections.length > 0) {
      qb.andWhere('activity.gift_collection_name IN (:...collections)', {
        collections,
      });
    }

    if (models.length > 0) {
      qb.andWhere('activity.gift_model_name IN (:...models)', { models });
    }

    if (backdrops.length > 0) {
      qb.andWhere('activity.gift_backdrop_name IN (:...backdrops)', {
        backdrops,
      });
    }

    if (patterns.length > 0) {
      qb.andWhere('activity.gift_pattern_name IN (:...patterns)', {
        patterns,
      });
    }

    const giftIdNum = Number(gift_id);
    if (!isNaN(giftIdNum)) {
      qb.andWhere('activity.gift_number = :giftId', { giftId: giftIdNum });
    }

    if (min_price && max_price) {
      qb.andWhere('activity.amount BETWEEN :min AND :max', {
        min: parseFloat(min_price as string),
        max: parseFloat(max_price as string),
      });
    } else if (min_price) {
      qb.andWhere('activity.amount >= :min', {
        min: parseFloat(min_price as string),
      });
    } else if (max_price) {
      qb.andWhere('activity.amount <= :max', {
        max: parseFloat(max_price as string),
      });
    }

    qb.orderBy('activity.created_at', 'DESC');

    qb.skip(skipNum).take(takeNum);

    const [activities, total] = await qb.getManyAndCount();
    const hasMore = skipNum + takeNum < total;

    res.json({ activities, total, hasMore });
  } catch (err) {
    console.error('❌ Ошибка при получении активности:', err);
    res.status(500).json({
      message: 'Ошибка при получении активности',
      error: (err as Error).message,
    });
  }
};
