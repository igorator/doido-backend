import Decimal from 'decimal.js';
import { DEFAULT_FEE } from '../../config/pricing';

const FEE = new Decimal(DEFAULT_FEE);

export function calculateBuyerPaysFromSellerAmount(amount: number): number {
  return new Decimal(amount).mul(FEE.add(1)).toNumber();
}
