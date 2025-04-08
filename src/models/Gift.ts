import { User } from './User';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Gift {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  title: string;

  @Column('int')
  number: number;

  @Column('text')
  model_name: string;

  @Column('text')
  model_emoji: string;

  @Column('text')
  symbol_name: string;

  @Column('text')
  symbol_emoji: string;

  @Column('text')
  backdrop_name: string;

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

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
