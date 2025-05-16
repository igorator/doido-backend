import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

class Model {
  @Column('text')
  name: string;

  @Column('float')
  rarity: number;

  @Column('text')
  emoji: string;
}

class Pattern {
  @Column('text')
  name: string;

  @Column('float')
  rarity: number;

  @Column('text')
  emoji: string;
}

class Backdrop {
  @Column('text')
  name: string;

  @Column('float')
  rarity: number;

  @Column('text')
  center_color: string;

  @Column('text')
  edge_color: string;

  @Column('text')
  symbol_color: string;

  @Column('text')
  text_color: string;
}

export enum GiftStatus {
  UNLISTED = 'unlisted',
  LISTED = 'listed',
  SOLD = 'sold',
  TRANSFERRED = 'transferred',
}

@Entity()
export class Gift {
  @PrimaryColumn('text', { unique: true })
  id: string;

  @Column('text', { default: 'gift' })
  readonly type: 'gift';

  @Column('text')
  collection_name: string;

  @Column('int')
  number: number;

  @Column(() => Model, { prefix: 'model' })
  model: Model;

  @Column(() => Pattern, { prefix: 'pattern' })
  pattern: Pattern;

  @Column(() => Backdrop, { prefix: 'backdrop' })
  backdrop: Backdrop;

  @Column('float', { default: 0 })
  sell_price: number;

  @Column('float', { default: 0 })
  sell_price_with_fee: number;

  @Column({
    type: 'enum',
    enum: GiftStatus,
    default: GiftStatus.UNLISTED,
  })
  status: GiftStatus;

  @Column('date', { nullable: true })
  listed_date: Date | null;

  @Column('date', { nullable: true })
  trasfered_date: Date | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  owner: User;
}
