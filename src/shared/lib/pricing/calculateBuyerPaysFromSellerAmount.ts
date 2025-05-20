import Decimal from 'decimal.js';
import { DEFAULT_FEE } from '../../config/pricing';

const FEE = new Decimal(DEFAULT_FEE);

/**
 * Возвращает сумму, которую должен заплатить покупатель (TON), включая комиссию.
 * @param amount - Сумма, которую хочет получить продавец (Decimal)
 * @returns Decimal
 */
export function calculateBuyerPaysFromSellerAmount(amount: Decimal): Decimal {
  return amount.mul(FEE.add(1)).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}
