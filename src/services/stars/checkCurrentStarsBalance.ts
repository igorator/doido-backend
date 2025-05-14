import { bot } from '../../bot/bot';

const STARS_DEPOSITER_ID = Number(process.env.TELEGRAM_STARS_DEPOSITER_ID);
const MIN_STARS_THRESHOLD = Number(process.env.TELEGRAM_STARS_THRESHOLD);
const CHECK_BALANCE_COOLDOWN_MS = 60_000;

const lastCheckTimestamps = new Map<string, number>();

export const checkCurrentStarsBalance = async (
  business_connection_id: string,
): Promise<{
  ok: boolean;
  currentAmount: number;
}> => {
  const now = Date.now();
  const lastCheck = lastCheckTimestamps.get(business_connection_id);

  if (lastCheck && now - lastCheck < CHECK_BALANCE_COOLDOWN_MS) {
    console.log('⏱ Пропущена повторная проверка баланса (cooldown)');
    return { ok: true, currentAmount: Infinity };
  }

  lastCheckTimestamps.set(business_connection_id, now);

  try {
    const result = await bot.api.getBusinessAccountStarBalance(
      business_connection_id,
    );
    const currentAmount = Number(result.amount);

    if (isNaN(currentAmount)) {
      await bot.api.sendMessage(
        STARS_DEPOSITER_ID,
        `⚠️ Ошибка: не удалось распознать количество звёзд для бизнес-аккаунта ${business_connection_id}`,
      );
      return { ok: false, currentAmount: 0 };
    }

    if (currentAmount < MIN_STARS_THRESHOLD) {
      await bot.api.sendMessage(
        STARS_DEPOSITER_ID,
        `⚠️ На балансе бизнес-аккаунта ${business_connection_id} всего ${currentAmount} звёзд.\nПожалуйста, пополни баланс.`,
      );
      return { ok: false, currentAmount };
    }

    return { ok: true, currentAmount };
  } catch (err) {
    console.error('❌ Ошибка при получении баланса звёзд:', err);
    await bot.api.sendMessage(
      STARS_DEPOSITER_ID,
      `❌ Ошибка при попытке получить баланс звёзд для бизнес-аккаунта ${business_connection_id}`,
    );
    return { ok: false, currentAmount: 0 };
  }
};
