import { User } from './User';
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Gift {
  @PrimaryColumn('text', { unique: true })
  id: string;

  @Column('text')
  title: string;

  @Column('int')
  number: number;

  @Column('text')
  model_name: string;

  @Column('float')
  model_rarity: number;

  @Column('text')
  model_emoji: string;

  @Column('text')
  pattern_name: string;

  @Column('float')
  pattern_rarity: number;

  @Column('text')
  pattern_emoji: string;

  @Column('text')
  backdrop_name: string;

  @Column('float')
  backdrop_rarity: number;

  @Column('text')
  backdrop_center_color: string;

  @Column('text')
  backdrop_edge_color: string;

  @Column('text')
  backdrop_symbol_color: string;

  @Column('text')
  backdrop_text_color: string;

  @Column('text')
  sticker_remote_id: string;

  @Column('text')
  thumbnail_remote_id: string;

  @Column('boolean', { default: false })
  is_published: boolean;

  @Column('float', { default: null })
  sell_price: number | null;

  @Column('date', { default: null })
  sell_date: Date | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  owner: User;
}
