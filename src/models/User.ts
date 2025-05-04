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
  @PrimaryColumn('text')
  id: string;

  @Column('text', { nullable: true, default: null })
  chat_id: string;

  @Column('text')
  username: string;

  @Column('text', { nullable: true })
  first_name: string;

  @Column('text', { nullable: true })
  last_name: string;

  @Column('text', { nullable: true })
  language_code: string;

  @Column('text', { nullable: true })
  photo_url: string; // 👈 добавлено поле для аватарки

  @Column('boolean', { default: false })
  allows_write_to_pm: boolean;

  @Column('float', { default: 0 })
  ton_balance: number;

  @Column('float', { default: 0 })
  total_market_amount: number;

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
