import { DecimalTransformer } from '../shared/lib/transformers/decimalToNumber';
import type Decimal from 'decimal.js';
import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
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

  @Column('boolean', { default: false })
  is_admin: boolean;

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

  @Column('decimal', {
    precision: 20,
    scale: 8,
    default: 0.0,
    transformer: DecimalTransformer,
    nullable: false,
  })
  referred_profit: Decimal;

  @OneToMany(() => Gift, (gift) => gift.owner)
  gifts: Gift[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      first_name: this.first_name,
      last_name: this.last_name,
      language_code: this.language_code,
      photo_url: this.photo_url,
      allows_write_to_pm: this.allows_write_to_pm,
      market_ton_balance: this.ton_balance?.toNumber?.() ?? 0,
      market_volume: {
        total_market_amount: this.total_market_amount?.toNumber?.() ?? 0,
        weekly_market_amount: this.weekly_market_amount?.toNumber?.() ?? 0,
      },
      referrals: {
        referralsProfit: this.referred_profit?.toNumber?.() ?? 0,
        referredBy: this.referred_by?.id ?? null,
        referralsCount: this.referred_users?.length ?? 0,
      },
      created_at: this.created_at,
    };
  }
}
