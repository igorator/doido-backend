import { User } from './User';
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Gift {
  @PrimaryColumn('text', { unique: true })
  gift_id: string;

  @Column('text')
  received_gift_id: string;

  @Column('text')
  gift_title: string;

  @Column('int')
  gift_number: number;

  @Column('text')
  model_name: string;

  @Column('float')
  model_rarity: number;

  @Column('text')
  model_emoji: string;

  @Column('text')
  symbol_name: string;

  @Column('float')
  symbol_rarity: number;

  @Column('text')
  symbol_emoji: string;

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

  @Column('boolean')
  is_published: boolean;

  @Column('float', { default: null })
  sell_price: number | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  owner: User;
}
