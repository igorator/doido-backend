import { Request, Response } from 'express';
import { ActivityItemType } from '../../../models/Activity';
import { AppDataSource } from '../../../database/db';

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
    const minPriceNum = min_price ? Number(min_price) : undefined;
    const maxPriceNum = max_price ? Number(max_price) : undefined;
    const giftIdNum = gift_id ? Number(gift_id) : undefined;

    const query = AppDataSource.getRepository('Activity')
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.gift', 'gift')
      .leftJoinAndSelect('activity.seller', 'seller')
      .leftJoinAndSelect('activity.buyer', 'buyer')
      .where('activity.item_type = :type', { type: ActivityItemType.GIFT });

    if (collection) {
      const values = Array.isArray(collection) ? collection : [collection];
      query.andWhere('gift.collection_name IN (:...collections)', {
        collections: values,
      });
    }

    if (model) {
      const values = Array.isArray(model) ? model : [model];
      query.andWhere('gift.model_name IN (:...models)', { models: values });
    }

    if (backdrop) {
      const values = Array.isArray(backdrop) ? backdrop : [backdrop];
      query.andWhere('gift.backdrop_name IN (:...backdrops)', {
        backdrops: values,
      });
    }

    if (pattern) {
      const values = Array.isArray(pattern) ? pattern : [pattern];
      query.andWhere('gift.pattern_name IN (:...patterns)', {
        patterns: values,
      });
    }

    if (!isNaN(giftIdNum)) {
      query.andWhere('gift.number = :giftId', { giftId: giftIdNum });
    }

    if (minPriceNum != null && maxPriceNum != null) {
      query.andWhere('activity.amount BETWEEN :min AND :max', {
        min: minPriceNum,
        max: maxPriceNum,
      });
    } else if (minPriceNum != null) {
      query.andWhere('activity.amount >= :min', { min: minPriceNum });
    } else if (maxPriceNum != null) {
      query.andWhere('activity.amount <= :max', { max: maxPriceNum });
    }

    const sortMap: Record<string, [string, 'ASC' | 'DESC']> = {
      latest: ['activity.created_at', 'DESC'],
      'price-asc': ['activity.amount', 'ASC'],
      'price-desc': ['activity.amount', 'DESC'],
      'id-asc': ['gift.number', 'ASC'],
      'id-desc': ['gift.number', 'DESC'],
    };

    const [orderField, orderDirection] = sortMap[
      sort as keyof typeof sortMap
    ] ?? ['activity.created_at', 'DESC'];

    query.orderBy(orderField, orderDirection);
    query.skip(skipNum);
    query.take(takeNum);

    const [activities, total] = await query.getManyAndCount();
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
