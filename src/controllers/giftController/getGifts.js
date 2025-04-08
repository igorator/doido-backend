import { giftRepository } from '../../database/repositories/giftRepository';

export const getGifts = async (req, res) => {
  try {
    const gifts = await giftRepository.find();
    res.json(gifts);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Ошибка при получении подарков', error: err.message });
  }
};
