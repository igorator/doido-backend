import { giftRepository } from '../../database/repositories/giftRepository';

export const addGift = async (giftData, user) => {
  if (!giftData || !user) {
    throw new Error('Недостаточно данных для создания подарка');
  }

  try {
    const gift = giftRepository.create({
      gift_id: giftData.id,
      gift_title: giftData.title,
      gift_number: giftData.number,
      model_name: giftData.model.name,
      model_rarity: giftData.model.rarity_per_mille,
      model_emoji: giftData.model.sticker.emoji,
      symbol_name: giftData.symbol.name,
      symbol_rarity: giftData.symbol.rarity_per_mille,
      symbol_emoji: giftData.symbol.sticker.emoji,
      backdrop_name: giftData.backdrop.name,
      backdrop_rarity: giftData.backdrop.rarity_per_mille,
      backdrop_center_color: giftData.backdrop.colors.center_color.toString(),
      backdrop_edge_color: giftData.backdrop.colors.edge_color.toString(),
      backdrop_symbol_color: giftData.backdrop.colors.symbol_color.toString(),
      backdrop_text_color: giftData.backdrop.colors.text_color.toString(),
      sticker_remote_id: giftData.model.sticker.remote.id,
      thumbnail_remote_id: giftData.model.sticker.thumbnail.file.remote.id,
      is_published: false,
      owner: user,
    });

    await giftRepository.save(gift);

    console.log('🎉 Подарок успешно сохранён в базу данных!');
  } catch (err) {
    console.error('❌ Ошибка при сохранении подарка:', err.message);
    throw new Error('Ошибка при сохранении подарка');
  }
};
