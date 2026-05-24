import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { DecimalTransformer } from '../shared/lib/transformers/decimalToNumber';
import type Decimal from 'decimal.js';

class Model {
  @Column('varchar', { length: 50 })
  name: string;

  @Column('decimal', { precision: 10, scale: 6 })
  rarity: number;

  @Column('varchar', { length: 8 })
  emoji: string;
}

class Pattern {
  @Column('varchar', { length: 50 })
  name: string;

  @Column('decimal', { precision: 10, scale: 6 })
  rarity: number;

  @Column('varchar', { length: 8 })
  emoji: string;
}

class Backdrop {
  @Column('varchar', { length: 50 })
  name: string;

  @Column('decimal', { precision: 10, scale: 6 })
  rarity: number;

  @Column('varchar', { length: 12 })
  center_color: string;

  @Column('varchar', { length: 12 })
  edge_color: string;

  @Column('varchar', { length: 12 })
  symbol_color: string;

  @Column('varchar', { length: 12 })
  text_color: string;
}

export enum GiftStatus {
  UNLISTED = 'unlisted',
  LISTED = 'listed',
  SOLD = 'sold',
}

@Entity()
export class Gift {
  @PrimaryColumn('varchar', { length: 20 })
  id: string;

  @Column('varchar', { length: 10, default: 'gift' })
  readonly type: 'gift';

  @Column('varchar', { length: 50 })
  collection_name: string;

  @Column('int')
  number: number;

  @Column(() => Model, { prefix: 'model' })
  model: Model;

  @Column(() => Pattern, { prefix: 'pattern' })
  pattern: Pattern;

  @Column(() => Backdrop, { prefix: 'backdrop' })
  backdrop: Backdrop;

  @Column('decimal', {
    precision: 20,
    scale: 8,
    default: 0,
    transformer: DecimalTransformer,
  })
  sell_price: Decimal;

  @Column('decimal', {
    precision: 20,
    scale: 8,
    default: 0,
    transformer: DecimalTransformer,
  })
  sell_price_with_fee: Decimal;

  @Column({
    type: 'enum',
    enum: GiftStatus,
    default: GiftStatus.UNLISTED,
  })
  status: GiftStatus;

  @Column('date', { nullable: true })
  listed_date: Date | null;

  @Column('integer', { default: 0, nullable: false })
  free_listings_used: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  owner: User;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  toJSON() {
    const { sell_price, sell_price_with_fee, owner, ...rest } = this;

    return {
      ...rest,
      sell_price: sell_price?.toNumber?.(),
      sell_price_with_fee: sell_price_with_fee?.toNumber?.(),
      owner: owner?.toJSON?.() ?? owner,
    };
  }
}
