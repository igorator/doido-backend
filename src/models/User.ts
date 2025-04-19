import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Gift } from './Gift';

@Entity()
export class User {
  @PrimaryColumn('int')
  id: number;

  @Column('text')
  user_name: string;

  @Column('text', { unique: true })
  chat_id: string;

  @Column('float', { default: 0 })
  ton_balance: number;

  @Column('float', { default: 0 })
  total_market_amount: number;

  @OneToMany(() => Gift, (gift) => gift.id)
  gifts: Gift[];
}
