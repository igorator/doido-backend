import { Entity, PrimaryColumn, Column } from 'typeorm';
import { DecimalTransformer } from '../shared/lib/transformers/decimalToNumber';
import type Decimal from 'decimal.js';

@Entity()
export class MarketInfo {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column('decimal', {
    precision: 20,
    scale: 8,
    default: 0,
    transformer: DecimalTransformer,
  })
  profit: Decimal;
}
