import { Request, Response } from 'express';
import { Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { ActivityItemType } from '../../../models/Activity';
import { activityRepository } from '../../../database/repositories/activityRepository';

export const getGiftsActivity = async (req: Request, res: Response) => {
  try {
    const {
      collection,
      model,
      backdrop,
      pattern,
      min_price,
      max_price,
      skip = 0,
      take = 20,
    } = req.query;

    const skipNum = Number(skip);
    const takeNum = Number(take);

    const where: any = {
      item_type: ActivityItemType.GIFT,
    };

    if (collection) {
      where.gift = { ...where.gift, collection_name: Like(`%${collection}%`) };
    }

    if (model) {
      where.gift = { ...where.gift, modelName: model };
    }

    if (backdrop) {
      where.gift = { ...where.gift, backdropName: backdrop };
    }

    if (pattern) {
      where.gift = { ...where.gift, patternName: pattern };
    }

    if (min_price && max_price) {
      where.amount = Between(Number(min_price), Number(max_price));
    } else if (min_price) {
      where.amount = MoreThanOrEqual(Number(min_price));
    } else if (max_price) {
      where.amount = LessThanOrEqual(Number(max_price));
    }

    const [activities, total] = await activityRepository.findAndCount({
      where,
      relations: ['gift', 'seller', 'buyer'],
      order: { created_at: 'DESC' },
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
