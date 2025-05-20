import { ValueTransformer } from 'typeorm';
import Decimal from 'decimal.js';

export const DecimalTransformer: ValueTransformer = {
  to: (value: Decimal) => value.toString(),
  from: (value: string | null) => (value ? new Decimal(value) : new Decimal(0)),
};
