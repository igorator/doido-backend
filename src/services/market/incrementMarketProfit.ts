import { AppDataSource } from '../../database/db';
import Decimal from 'decimal.js';
import { MarketInfo } from '../../models/MarketInfo';

export const incrementMarketProfit = async (reason: string, amount: Decimal): Promise<void> => {
  if (!(amount instanceof Decimal) || !amount.isFinite() || amount.lte(0)) {
    console.warn(`incrementMarketProfit(${reason}): invalid amount`, amount?.toString());
    return;
  }

  await AppDataSource.getRepository(MarketInfo).increment({ id: 1 }, 'profit', amount.toNumber());

  console.log(
    `[${new Date().toISOString()}] 💰 Market profit +${amount.toFixed(3)} TON (${reason})`,
  );
};
