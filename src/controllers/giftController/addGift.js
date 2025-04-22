import { giftRepository } from '../../database/repositories/giftRepository';

export const addGift = async (giftData, user) => {
  if (!giftData || typeof giftData !== 'object' || !user?.id) {
    throw new Error('Недостаточно данных для создания подарка');
  }

  const { id, title, number, model, symbol, backdrop } = giftData;

  console.log(JSON.stringify(giftData, null, 2));

  const gift = giftRepository.create({
    id,
    title,
    number,
    model_name: model?.name ?? '',
    model_rarity: model?.rarity_per_mille ?? 0,
    model_emoji: model?.sticker?.emoji ?? '',
    pattern_name: symbol?.name ?? '',
    pattern_rarity: symbol?.rarity_per_mille ?? 0,
    pattern_emoji: symbol?.sticker?.emoji ?? '',
    backdrop_name: backdrop?.name ?? '',
    backdrop_rarity: backdrop?.rarity_per_mille ?? 0,
    backdrop_center_color: backdrop?.colors?.center_color?.toString() ?? '',
    backdrop_edge_color: backdrop?.colors?.edge_color?.toString() ?? '',
    backdrop_symbol_color: backdrop?.colors?.symbol_color?.toString() ?? '',
    backdrop_text_color: backdrop?.colors?.text_color?.toString() ?? '',
    sticker_remote_id: model?.sticker?.remote?.id ?? '',
    thumbnail_remote_id: model?.sticker?.thumbnail?.file?.remote?.id ?? '',
    is_published_for_sale: false,
    sell_price: null,
    sell_date: null,
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
