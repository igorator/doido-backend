import { AppDataSource } from '../../database/db';
import Decimal from 'decimal.js';
import { MarketInfo } from '../../models/MarketInfo';

export const incrementMarketProfit = async (
  _reason: string,
  amount: Decimal,
): Promise<void> => {
  if (!amount || !(amount instanceof Decimal)) {
    console.warn(
      '❌ incrementMarketProfit: неверное или пустое значение amount:',
      amount?.toString?.(),
    );
    return;
  }

  const repo = AppDataSource.getRepository(MarketInfo);

  await repo.increment({ id: 1 }, 'profit', amount.toNumber());

  const updated = await repo.findOneBy({ id: 1 });

  console.log(
    `💰 incrementMarketProfit: добавлено ${amount.toFixed(
      3,
    )} TON. Профит на данный момент: ${updated?.profit.toFixed(3)} TON`,
  );
};
