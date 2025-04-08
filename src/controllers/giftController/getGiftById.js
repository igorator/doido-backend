import { giftRepository } from '../../database/repositories/giftRepository';

export const getGiftById = async (req, res) => {
  try {
    const gift = await giftRepository.findOneBy({
      id: parseInt(req.params.id),
    });
    if (!gift) {
      return res.status(404).json({ message: 'Подарок не найден' });
    }
    res.json(gift);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Ошибка при получении подарка', error: err.message });
  }
};
