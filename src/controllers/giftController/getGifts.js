import { giftRepository } from '../../database/repositories/giftRepository';
import { Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export const getGifts = async (req, res) => {
  try {
    const {
      collection,
      model,
      backdrop,
      is_published,
      min_price,
      max_price,
      sort,
      gift_id,
      owner_id,
    } = req.query;

    const collections = Array.isArray(collection)
      ? collection
      : collection
      ? [collection]
      : [];

    const baseFilters = {};

    if (owner_id) {
      baseFilters['owner.id'] = Number(owner_id);
    }

    if (typeof listed !== 'undefined') {
      baseFilters['is_listed'] = listed === 'true';
    }

    if (model) {
      baseFilters['model.name'] = Like(`%${model}%`);
    }

    if (backdrop) {
      baseFilters['backdrop.name'] = Like(`%${backdrop}%`);
    }

    if (typeof is_published !== 'undefined') {
      baseFilters['is_listed'] = is_published === 'true';
    }

    if (gift_id) {
      baseFilters['number'] = Number(gift_id);
    }

    if (min_price || max_price) {
      const priceFilters = {};
      if (min_price) priceFilters['$gte'] = Number(min_price);
      if (max_price) priceFilters['$lte'] = Number(max_price);

      baseFilters['sell_price'] =
        priceFilters['$gte'] && priceFilters['$lte']
          ? {
              ...MoreThanOrEqual(priceFilters['$gte']),
              ...LessThanOrEqual(priceFilters['$lte']),
            }
          : priceFilters['$gte']
          ? MoreThanOrEqual(priceFilters['$gte'])
          : LessThanOrEqual(priceFilters['$lte']);
    }

    const order =
      sort === 'price-asc'
        ? { sell_price: 'ASC' }
        : sort === 'price-desc'
        ? { sell_price: 'DESC' }
        : sort === 'latest'
        ? { number: 'DESC' }
        : sort === 'id-asc'
        ? { number: 'ASC' }
        : sort === 'id-desc'
        ? { number: 'DESC' }
        : {};

    // 🧠 Основной where
    const where =
      collections.length > 0
        ? collections.map((col) => ({
            ...baseFilters,
            collection_name: Like(`%${col}%`),
          }))
        : baseFilters;

    const gifts = await giftRepository.find({ where, order });

    return res.json(gifts);
  } catch (err) {
    console.error('❌ Ошибка при получении подарков:', err);
    return res.status(500).json({
      message: 'Ошибка при получении подарков',
      error: err.message,
    });
  }
};
