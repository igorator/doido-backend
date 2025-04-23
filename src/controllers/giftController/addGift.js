import { giftRepository } from '../../database/repositories/giftRepository';

export const addGift = async (giftData, user) => {
  if (!giftData || typeof giftData !== 'object' || !user?.id) {
    throw new Error('Недостаточно данных для создания подарка');
  }

  const { id, title, number, model, symbol, backdrop } = giftData;

  const gift = giftRepository.create({
    id,
    collection_name: title,
    number,
    model: {
      name: model?.name ?? '',
      rarity: model?.rarity_per_mille ?? 0,
      emoji: model?.sticker?.emoji ?? '',
    },
    pattern: {
      name: symbol?.name ?? '',
      rarity: symbol?.rarity_per_mille ?? 0,
      emoji: symbol?.sticker?.emoji ?? '',
    },
    backdrop: {
      name: backdrop?.name ?? '',
      rarity: backdrop?.rarity_per_mille ?? 0,
      center_color: backdrop?.colors?.center_color?.toString() ?? '',
      edge_color: backdrop?.colors?.edge_color?.toString() ?? '',
      symbol_color: backdrop?.colors?.symbol_color?.toString() ?? '',
      text_color: backdrop?.colors?.text_color?.toString() ?? '',
    },
    is_listed: false,
    sell_price: null,
    listed_date: null,
    owner: user,
  });

  try {
    await giftRepository.save(gift);
    console.log('🎉 Подарок успешно сохранён в базу данных!');
  } catch (err) {
    console.error('❌ Ошибка при сохранении подарка:', err.message);
    throw new Error('Ошибка при сохранении подарка');
  }
};
