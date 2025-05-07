import type { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { Like, In, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export const getGiftsByUserId = async (req: Request, res: Response) => {
  try {
    const telegramUser = (req as any).telegramUser;
    if (!telegramUser?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      collection,
      model,
      backdrop,
      pattern,
      min_price,
      max_price,
      sort,
      gift_id,
      is_listed,
      skip = '0',
      take = '20',
    } = req.query;

    const skipNum = parseInt(skip as string, 10);
    const takeNum = parseInt(take as string, 10);

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

    const baseFilters: any = {
      owner: { id: String(telegramUser.id) },
      ...(typeof is_listed !== 'undefined' && {
        is_listed: is_listed === 'true',
      }),
      ...(gift_id && { number: Number(gift_id) }),
    };

    if (min_price && max_price) {
      baseFilters.sell_price = Between(Number(min_price), Number(max_price));
    } else if (min_price) {
      baseFilters.sell_price = MoreThanOrEqual(Number(min_price));
    } else if (max_price) {
      baseFilters.sell_price = LessThanOrEqual(Number(max_price));
    }

    const order: Record<string, 'asc' | 'desc'> =
      sort === 'price-asc'
        ? { sell_price: 'asc' }
        : sort === 'price-desc'
        ? { sell_price: 'desc' }
        : sort === 'latest'
        ? { number: 'desc' }
        : sort === 'id-asc'
        ? { number: 'asc' }
        : sort === 'id-desc'
        ? { number: 'desc' }
        : {};

    const where = collections.length
      ? collections.map((col) => ({
          ...baseFilters,
          collection_name: Like(`%${col}%`),
          ...(models.length && { model: { name: In(models) } }),
          ...(backdrops.length && { backdrop: { name: In(backdrops) } }),
          ...(patterns.length && { pattern: { name: In(patterns) } }),
        }))
      : [
          {
            ...baseFilters,
            ...(models.length && { model: { name: In(models) } }),
            ...(backdrops.length && { backdrop: { name: In(backdrops) } }),
            ...(patterns.length && { pattern: { name: In(patterns) } }),
          },
        ];

    const [gifts, total] = await giftRepository.findAndCount({
      where,
      order,
      relations: ['owner', 'model', 'pattern', 'backdrop'],
      skip: skipNum,
      take: takeNum,
    });

    const sanitized = gifts.map((gift) => ({
      ...gift,
      owner: gift.owner ? { id: gift.owner.id } : null,
    }));

    return res.json({ gifts: sanitized, total });
  } catch (err) {
    console.error('❌ Error fetching user gifts:', err);
    return res.status(500).json({
      error: (err as Error).message || 'Server error',
    });
  }
};
