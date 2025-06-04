import { Request, Response } from 'express';
import { In, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '../../../database/db';
import { ActivityItemType } from '../../../models/Activity';

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

    // Базовый фильтр
    const baseFilters: any = {
      item_type: ActivityItemType.GIFT,
    };

    // Фильтры по подарку (вложенные)
    const giftFilters: any = {};

    if (collections.length > 0) {
      giftFilters.collection_name = In(collections);
    }
    if (models.length > 0) {
      giftFilters['model.name'] = In(models);
    }
    if (backdrops.length > 0) {
      giftFilters['backdrop.name'] = In(backdrops);
    }
    if (patterns.length > 0) {
      giftFilters['pattern.name'] = In(patterns);
    }
    if (gift_id) {
      giftFilters.number = Number(gift_id);
    }

    // Ценовой диапазон
    if (min_price && max_price) {
      baseFilters.amount = Between(Number(min_price), Number(max_price));
    } else if (min_price) {
      baseFilters.amount = MoreThanOrEqual(Number(min_price));
    } else if (max_price) {
      baseFilters.amount = LessThanOrEqual(Number(max_price));
    }

    // Сортировка
    const order: any =
      sort === 'price-asc'
        ? { amount: 'ASC' }
        : sort === 'price-desc'
        ? { amount: 'DESC' }
        : sort === 'latest'
        ? { created_at: 'DESC' }
        : sort === 'id-asc'
        ? { 'gift.number': 'ASC' }
        : sort === 'id-desc'
        ? { 'gift.number': 'DESC' }
        : { created_at: 'DESC' };

    // where: массив — если фильтруем по коллекциям, иначе один объект
    const where =
      collections.length > 0
        ? collections.map((col) => ({
            ...baseFilters,
            gift: {
              ...giftFilters,
              collection_name: col,
            },
          }))
        : [
            {
              ...baseFilters,
              gift: giftFilters,
            },
          ];

    const activityRepo = AppDataSource.getRepository('Activity');
    const [activities, total] = await activityRepo.findAndCount({
      where,
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
