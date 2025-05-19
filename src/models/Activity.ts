import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Gift } from './Gift';

export enum ActivityItemType {
  GIFT = 'gift',
  STICKER = 'sticker',
}

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ActivityItemType })
  item_type: ActivityItemType;

  @Column('varchar', { length: 20 })
  item_id: string;

  @ManyToOne(() => Gift, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: false, // загружать вручную при необходимости
  })
  gift?: Gift;

  // Можно добавить в будущем:
  // @ManyToOne(() => Sticker, { nullable: true, onDelete: 'SET NULL' })
  // sticker?: Sticker;

  @ManyToOne(() => User, { nullable: false })
  seller: User;

  @ManyToOne(() => User, { nullable: false })
  buyer: User;

  @Column('decimal', { precision: 20, scale: 10 })
  amount: number;

  @CreateDateColumn()
  created_at: Date;
}
