import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn('int')
  id: number;

  @Column('float')
  ton_balance: number;
}
