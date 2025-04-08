import { giftRepository } from '../../database/repositories/giftRepository';

export const getUserGifts = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const gifts = await giftRepository.find({
      where: { user: { id: userId } },
    });
    res.json(gifts);
  } catch (err) {
    res.status(500).json({
      message: 'Ошибка при получении подарков пользователя',
      error: err.message,
    });
  }
};
