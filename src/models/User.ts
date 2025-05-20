import { DecimalTransformer } from '../shared/lib/transformers/decimalToNumber';

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
  @PrimaryColumn('varchar', { length: 20 }) // Telegram ID
  id: string;

  @Column('varchar', { length: 32 }) // Telegram username (максимум 32 символа)
  username: string;

  @Column('varchar', { length: 64, nullable: true }) // first_name
  first_name: string;

  @Column('varchar', { length: 64, nullable: true }) // last_name
  last_name: string;

  @Column('varchar', { length: 10, nullable: true }) // ISO-код языка (en, ru, uk)
  language_code: string;

  @Column('varchar', { length: 512, nullable: true }) // безопасный запас для URL
  photo_url: string;

  @Column('boolean', { default: false })
  allows_write_to_pm: boolean;

  @Column('decimal', {
    precision: 20,
    scale: 10,
    default: 0.0,
    transformer: DecimalTransformer,
  })
  ton_balance: number;

  @Column('decimal', {
    precision: 20,
    scale: 10,
    default: 0.0,
    transformer: DecimalTransformer,
  })
  total_market_amount: number;

  @Column('decimal', {
    precision: 20,
    scale: 10,
    default: 0.0,
    transformer: DecimalTransformer,
  })
  weekly_market_amount: number;

  @ManyToOne(() => User, (user) => user.referred_users, { nullable: true })
  @JoinColumn({ name: 'referredById' })
  referred_by?: User;

  @OneToMany(() => User, (user) => user.referred_by)
  referred_users?: User[];

  @OneToMany(() => Gift, (gift) => gift.owner)
  gifts: Gift[];

  get referrals() {
    return {
      referredBy: this.referred_by?.id ?? null,
      referralsCount: this.referred_users?.length ?? 0,
    };
  }

  toJSON() {
    const { referred_by, referred_users, ...rest } = this;
    return {
      ...rest,
      referrals: this.referrals,
    };
  }
}
