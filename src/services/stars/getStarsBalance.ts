import { bot } from '../../bot/bot';

export const getStarsBalance = async (businessConnectionId: string): Promise<number | null> => {
  try {
    const result = await bot.api.getBusinessAccountStarBalance(businessConnectionId);
    const amount = Number(result.amount);

    if (isNaN(amount)) {
      console.warn(
        `❌ Could not parse star balance amount for business_connection_id: ${businessConnectionId}`,
        result.amount,
      );
      return null;
    }

    return amount;
  } catch (err) {
    console.error(`❌ Error calling getBusinessAccountStarBalance(${businessConnectionId}):`, err);
    return null;
  }
};
