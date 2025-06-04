import { Request, Response } from 'express';
import { In, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '../../database/db';
import { ActivityItemType } from '../../models/Activity';

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
      sort = 'latest',
    } = req.query;

    const skipNum = Number(skip);
    const takeNum = Number(take);

    // Приведение к массиву для всех фильтров
    const collections = Array.isArray(collection)
      ? collection
      : collection
      ? [collection]
      : [];
    const models = Array.isArray(model) ? model : model ? [model] : [];
    const backdrops = Array.isArray(backdrop)
      ? backdrop
      : backdrop
      ? [backdrop]
      : [];
    const patterns = Array.isArray(pattern)
      ? pattern
      : pattern
      ? [pattern]
      : [];

    const baseWhere: any = {
      item_type: ActivityItemType.GIFT,
    };

    const whereList: any[] = collections.length
      ? collections.map((col) => ({
          ...baseWhere,
          gift: {
            ...(col && { collection_name: col }),
            ...(models.length > 0 && { model_name: In(models) }),
            ...(backdrops.length > 0 && { backdrop_name: In(backdrops) }),
            ...(patterns.length > 0 && { pattern_name: In(patterns) }),
            ...(gift_id && { number: Number(gift_id) }),
          },
        }))
      : [
          {
            ...baseWhere,
            gift: {
              ...(models.length > 0 && { model_name: In(models) }),
              ...(backdrops.length > 0 && { backdrop_name: In(backdrops) }),
              ...(patterns.length > 0 && { pattern_name: In(patterns) }),
              ...(gift_id && { number: Number(gift_id) }),
            },
          },
        ];

    if (min_price && max_price) {
      whereList.forEach((w) => {
        w.amount = Between(Number(min_price), Number(max_price));
      });
    } else if (min_price) {
      whereList.forEach((w) => {
        w.amount = MoreThanOrEqual(Number(min_price));
      });
    } else if (max_price) {
      whereList.forEach((w) => {
        w.amount = LessThanOrEqual(Number(max_price));
      });
    }

    const orderMap: Record<string, any> = {
      latest: { created_at: 'DESC' },
      'price-asc': { amount: 'ASC' },
      'price-desc': { amount: 'DESC' },
      'id-asc': { 'gift.number': 'ASC' },
      'id-desc': { 'gift.number': 'DESC' },
    };
    const order = orderMap[sort as keyof typeof orderMap] ?? {
      created_at: 'DESC',
    };

    // Основной запрос
    const activityRepo = AppDataSource.getRepository('Activity');
    const [activities, total] = await activityRepo.findAndCount({
      where: whereList,
      relations: ['gift', 'seller', 'buyer'],
      order,
      skip: skipNum,
      take: takeNum,
    });

    const hasMore = skipNum + takeNum < total;

    res.json({ activities, total, hasMore });
  } catch (err) {
    console.error('❌ Ошибка при получении активности по подаркам:', err);
    res.status(500).json({
      message: 'Ошибка при получении активности',
      error: (err as Error).message,
    });
  }
};
