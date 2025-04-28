import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { Like, In, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';

export const getGiftsByUserId = async (req: Request, res: Response) => {
  try {
    const {
      owner_id,
      collection,
      model,
      backdrop,
      pattern,
      min_price,
      max_price,
      sort,
      gift_id,
      is_listed,
    } = req.query;

    if (!owner_id || typeof owner_id !== 'string') {
      return res.status(400).json({ message: 'owner_id is required' });
    }

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
      owner: { id: String(owner_id) },
    };

    if (typeof is_listed !== 'undefined') {
      baseFilters.is_listed = is_listed === 'true';
    }

    if (gift_id) {
      baseFilters.number = Number(gift_id);
    }

    if (min_price && max_price) {
      baseFilters.sell_price = Between(Number(min_price), Number(max_price));
    } else if (min_price) {
      baseFilters.sell_price = MoreThanOrEqual(Number(min_price));
    } else if (max_price) {
      baseFilters.sell_price = LessThanOrEqual(Number(max_price));
    }

    const order: any =
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
          ...(models.length > 0 && { model: { name: In(models) } }),
          ...(backdrops.length > 0 && { backdrop: { name: In(backdrops) } }),
          ...(patterns.length > 0 && { pattern: { name: In(patterns) } }),
        }))
      : [
          {
            ...baseFilters,
            ...(models.length > 0 && { model: { name: In(models) } }),
            ...(backdrops.length > 0 && { backdrop: { name: In(backdrops) } }),
            ...(patterns.length > 0 && { pattern: { name: In(patterns) } }),
          },
        ];

    const gifts = await giftRepository.find({
      where,
      order,
      relations: ['owner', 'model', 'pattern', 'backdrop'],
    });

    const sanitized = gifts.map((gift) => ({
      ...gift,
      owner: gift.owner ? { id: gift.owner.id } : null,
    }));

    return res.json(sanitized);
  } catch (err) {
    console.error('❌ Ошибка при получении подарков пользователя:', err);
    return res.status(500).json({
      message: 'Ошибка при получении подарков пользователя',
      error: (err as Error).message,
    });
  }
};
