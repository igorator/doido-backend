import { ValueTransformer } from 'typeorm';
import Decimal from 'decimal.js';

export const DecimalTransformer: ValueTransformer = {
  to: (value: Decimal | number) => value?.toString?.() ?? value,
  from: (value: string | null) =>
    value !== null ? new Decimal(value) : new Decimal(0),
};
