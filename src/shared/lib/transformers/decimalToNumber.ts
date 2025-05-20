import { ValueTransformer } from 'typeorm';
import Decimal from 'decimal.js';

export const DecimalTransformer: ValueTransformer = {
  to: (value: Decimal | number | string | null | undefined): string => {
    if (value instanceof Decimal) return value.toString();
    if (typeof value === 'number' || typeof value === 'string')
      return new Decimal(value).toString();
    return '0';
  },
  from: (value: string | null): Decimal => {
    return value !== null ? new Decimal(value) : new Decimal(0);
  },
};
