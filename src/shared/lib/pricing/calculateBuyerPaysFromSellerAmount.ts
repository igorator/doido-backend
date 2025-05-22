import Decimal from 'decimal.js';

const FEE = new Decimal(process.env.DEFAULT_FEE);

export function calculateBuyerPaysFromSellerAmount(amount: Decimal): Decimal {
  return amount.mul(FEE.add(1)).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}
