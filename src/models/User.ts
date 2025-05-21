import { DecimalTransformer } from '../shared/lib/transformers/decimalToNumber';
import type Decimal from 'decimal.js';

import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Gift } from './Gift';

@Entity()
export class User {
  @PrimaryColumn('varchar', { length: 20 })
  id: string;

  @Column('varchar', { length: 32 })
  username: string;

  @Column('varchar', { length: 64, nullable: true })
  first_name: string;

  @Column('varchar', { length: 64, nullable: true })
  last_name: string;

  @Column('varchar', { length: 10, nullable: true })
  language_code: string;

  @Column('varchar', { length: 512, nullable: true })
  photo_url: string;

  @Column('boolean', { default: false })
  allows_write_to_pm: boolean;

  @Column('decimal', {
    precision: 20,
    scale: 8,
    default: 0.0,
    transformer: DecimalTransformer,
  })
  ton_balance: Decimal;

  @Column('decimal', {
    precision: 20,
    scale: 8,
    default: 0.0,
    transformer: DecimalTransformer,
  })
  total_market_amount: Decimal;

  @Column('decimal', {
    precision: 20,
    scale: 10,
    default: 0.0,
    transformer: DecimalTransformer,
  })
  weekly_market_amount: Decimal;

  @ManyToOne(() => User, (user) => user.referred_users, { nullable: true })
  @JoinColumn({ name: 'referredById' })
  referred_by?: User;

  @OneToMany(() => User, (user) => user.referred_by)
  referred_users?: User[];

  @OneToMany(() => Gift, (gift) => gift.owner)
  gifts: Gift[];

  toJSON() {
    const {
      referred_by,
      referred_users,
      ton_balance,
      total_market_amount,
      weekly_market_amount,
      ...rest
    } = this;

    return {
      ...rest,
      ton_balance: ton_balance?.toNumber?.() ?? 0,
      market_volume: {
        total_market_amount: total_market_amount?.toNumber?.() ?? 0,
        weekly_market_amount: weekly_market_amount?.toNumber?.() ?? 0,
      },
      referrals: {
        referredBy: referred_by?.id ?? null,
        referralsCount: referred_users?.length ?? 0,
      },
    };
  }
}
