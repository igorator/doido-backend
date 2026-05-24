import { botSendMessage } from '../messages/botSendMessage';
import { getStarsBalance } from './getStarsBalance';
import { config } from '../../config';

const STARS_DEPOSITER_ID = config.telegram.starsDepositerId;
const MIN_STARS_THRESHOLD = config.telegram.minStarsThreshold;
const CHECK_BALANCE_COOLDOWN_MS = 120_000;

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
    console.log(
      `⏱ Пропущена проверка баланса для ${business_connection_id} (cooldown ${CHECK_BALANCE_COOLDOWN_MS}ms)`,
    );
    return { ok: true, currentAmount: Infinity };
  }

  lastCheckTimestamps.set(business_connection_id, now);
  console.log(`🔍 Проверка баланса звёзд для ${business_connection_id}...`);

  const currentAmount = await getStarsBalance(business_connection_id);

  if (currentAmount === null) {
    await botSendMessage(
      STARS_DEPOSITER_ID,
      `❌ Ошибка при попытке получить баланс звёзд для бизнес-аккаунта <code>${business_connection_id}</code>`,
      'HTML',
    );
    return { ok: false, currentAmount: 0 };
  }

  console.log(`⭐ Баланс для ${business_connection_id}: ${currentAmount}`);

  console.log(
    `ℹ️ Проверка порога: currentAmount = ${currentAmount}, MIN_STARS_THRESHOLD = ${MIN_STARS_THRESHOLD}, тип = ${typeof MIN_STARS_THRESHOLD}`,
  );

  if (currentAmount < MIN_STARS_THRESHOLD) {
    console.log(
      `⚠️ Баланс звёзд ниже порога: ${currentAmount} < ${MIN_STARS_THRESHOLD}`,
    );

    await botSendMessage(
      STARS_DEPOSITER_ID,
      `⚠️ Юрчик друууууг! На балансе бота всего <b>${currentAmount}</b> звёзд.⚠️`,
      'HTML',
    );

    return { ok: false, currentAmount };
  }

  return { ok: true, currentAmount };
};
