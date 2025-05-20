import Decimal from 'decimal.js';
import { DEFAULT_FEE } from '../../config/pricing';

const FEE = new Decimal(DEFAULT_FEE);

/**
 * Вычисляет, сколько получит продавец, если покупатель платит `amount` TON.
 * @param amount - Сумма от покупателя (Decimal)
 * @returns Decimal — сколько получит продавец
 */
export function calculateSellerReceivesFromBuyerAmount(
  amount: Decimal,
): Decimal {
  return amount.div(FEE.add(1)).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}
