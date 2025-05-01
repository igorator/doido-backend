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

  @Column('boolean', { default: false })
  is_listed: boolean;

  @Column('date', { default: null })
  listed_date: Date | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  owner: User;
}
