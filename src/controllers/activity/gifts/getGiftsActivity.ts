import { Request, Response } from 'express';

AppDataSource;

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
      skip = 0,
      take = 10,
      sort = 'latest',
    } = req.query;

    const skipNum = Number(skip);
    const takeNum = Number(take);

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

    const activityRepo = AppDataSource.getRepository(Activity);
    const qb = activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.gift', 'gift')
      .leftJoinAndSelect('activity.seller', 'seller')
      .leftJoinAndSelect('activity.buyer', 'buyer')
      .where('activity.item_type = :itemType', {
        itemType: ActivityItemType.GIFT,
      });

    // --- Фильтры по gift (коллекция, модель, backdrop, pattern) ---
    if (collections.length > 0) {
      qb.andWhere('gift.collection_name IN (:...collections)', { collections });
    }
    if (models.length > 0) {
      qb.andWhere('gift.model.name IN (:...models)', { models });
    }
    if (backdrops.length > 0) {
      qb.andWhere('gift.backdrop.name IN (:...backdrops)', { backdrops });
    }
    if (patterns.length > 0) {
      qb.andWhere('gift.pattern.name IN (:...patterns)', { patterns });
    }
    if (gift_id) {
      qb.andWhere('gift.number = :giftId', { giftId: Number(gift_id) });
    }

    // --- Ценовой диапазон ---
    if (min_price && max_price) {
      qb.andWhere('activity.amount BETWEEN :min AND :max', {
        min: Number(min_price),
        max: Number(max_price),
      });
    } else if (min_price) {
      qb.andWhere('activity.amount >= :min', { min: Number(min_price) });
    } else if (max_price) {
      qb.andWhere('activity.amount <= :max', { max: Number(max_price) });
    }

    // --- Сортировка ---
    switch (sort) {
      case 'price-asc':
        qb.orderBy('activity.amount', 'ASC');
        break;
      case 'price-desc':
        qb.orderBy('activity.amount', 'DESC');
        break;
      case 'latest':
        qb.orderBy('activity.created_at', 'DESC');
        break;
      case 'id-asc':
        qb.orderBy('gift.number', 'ASC');
        break;
      case 'id-desc':
        qb.orderBy('gift.number', 'DESC');
        break;
      default:
        qb.orderBy('activity.created_at', 'DESC');
        break;
    }

    qb.skip(skipNum).take(takeNum);

    const [activities, total] = await qb.getManyAndCount();

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
