import { giftRepository } from '../../database/repositories/giftRepository';

export const addGift = async (req, res) => {
  try {
    const gift = giftRepository.create(req.body);
    const savedGift = await giftRepository.save(gift);
    res.status(201).json(savedGift);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Ошибка при создании подарка', error: err.message });
  }
};
