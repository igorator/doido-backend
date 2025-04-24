import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Gift } from './Gift';

@Entity()
export class User {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  username: string;

  @Column('text', { nullable: true })
  first_name: string;

  @Column('boolean', { default: false })
  allows_write_to_pm: boolean;

  @Column('float', { default: 0 })
  ton_balance: number;

  @Column('float', { default: 0 })
  total_market_amount: number;

  @OneToMany(() => Gift, (gift) => gift.owner)
  gifts: Gift[];
}
