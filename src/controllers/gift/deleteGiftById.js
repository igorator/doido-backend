import { giftRepository } from '../../database/repositories/giftRepository';

export const deleteGiftById = async (req, res) => {
  try {
    const giftId = req.params.id;

    const gift = await giftRepository.findOneBy({ id: giftId });

    if (!gift) {
      return res
        .status(404)
        .json({ message: 'Подарок не найден для удаления' });
    }

    await giftRepository.remove(gift);
    res.json({ message: 'Подарок успешно удалён' });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Ошибка при удалении подарка', error: err.message });
  }
};
