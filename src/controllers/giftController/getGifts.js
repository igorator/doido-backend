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
    } = req.query;

    console.log(req.query);

    const where = {};

    if (collection) where['collection_name'] = Like(`%${collection}%`);
    if (model) where['model_name'] = Like(`%${model}%`);
    if (backdrop) where['backdrop_name'] = Like(`%${backdrop}%`);
    if (is_published !== undefined)
      where['is_published'] = is_published === 'true';
    if (gift_id) where['number'] = Number(gift_id);
    if (min_price || max_price) {
      if (min_price) where['sell_price'] = MoreThanOrEqual(Number(min_price));
      if (max_price) {
        where['sell_price'] = {
          ...(where['sell_price'] || {}),
          ...LessThanOrEqual(Number(max_price)),
        };
      }
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

    const gifts = await giftRepository.find({ where, order });

    res.json(gifts);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Ошибка при получении подарков',
      error: err.message,
    });
  }
};
