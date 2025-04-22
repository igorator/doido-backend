import { giftRepository } from '../../database/repositories/giftRepository';
import { Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export const getGifts = async (req, res) => {
  try {
    const { model, backdrop, is_published, min_price, max_price, sort } =
      req.query;

    const where = {};

    if (model) where['model_name'] = Like(`%${model}%`);
    if (backdrop) where['backdrop_name'] = Like(`%${backdrop}%`);
    if (is_published !== undefined)
      where['is_published'] = is_published === 'true';

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
        ? { gift_number: 'DESC' }
        : sort === 'id-asc'
        ? { gift_id: 'ASC' }
        : sort === 'id-desc'
        ? { gift_id: 'DESC' }
        : {};

    const gifts = await giftRepository.find({ where, order });

    console.log(res);

    res.json(gifts);
  } catch (err) {
    res.status(500).json({
      message: 'Ошибка при получении подарков',
      error: err.message,
    });
  }
};
