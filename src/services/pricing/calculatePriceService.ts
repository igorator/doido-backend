import Decimal from 'decimal.js';
import { createHttpError } from '../../shared/lib/httpError';
import { config } from '../../config';

const FEE = new Decimal(config.fees.marketPercent);

export type PriceDirection = 'fromSeller' | 'fromBuyer';

export interface PriceCalculation {
  sellerPrice: Decimal;
  buyerPays: Decimal;
}

export function calculatePriceService(
  amount: Decimal,
  direction: PriceDirection,
): PriceCalculation {
  if (!amount.isFinite() || amount.lte(0)) {
    throw createHttpError('Amount must be a positive number', 400);
  }

  if (direction === 'fromSeller') {
    return {
      sellerPrice: amount,
      buyerPays: amount.mul(FEE.plus(1)).toDecimalPlaces(3, Decimal.ROUND_HALF_UP),
    };
  }

  return {
    sellerPrice: amount.div(FEE.plus(1)).toDecimalPlaces(3, Decimal.ROUND_HALF_UP),
    buyerPays: amount,
  };
}
