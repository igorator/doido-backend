import { bot } from '../../bot/bot';

export const getStarsBalance = async (
  business_connection_id: string,
): Promise<number | null> => {
  try {
    const result = await bot.api.getBusinessAccountStarBalance(
      business_connection_id,
    );
    const amount = Number(result.amount);

    if (isNaN(amount)) {
      console.warn(
        `❌ Не удалось преобразовать amount:`,
        result.amount,
        `для business_connection_id: ${business_connection_id}`,
      );
      return null;
    }

    return amount;
  } catch (err) {
    console.error(
      `❌ Ошибка при вызове getBusinessAccountStarBalance(${business_connection_id}):`,
      err,
    );
    return null;
  }
};
