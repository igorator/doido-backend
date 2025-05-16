import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Gift } from './Gift';

export type ActivityItemType = 'gift' | 'sticker';

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['gift', 'sticker'] })
  item_type: ActivityItemType;

  @Column('text')
  item_id: string;

  @ManyToOne(() => Gift, { nullable: true, onDelete: 'SET NULL' })
  gift?: Gift;

  // ⏳ Stickers
  // @ManyToOne(() => Sticker, { nullable: true, onDelete: 'SET NULL' })
  // sticker?: Sticker;

  @ManyToOne(() => User)
  seller: User;

  @ManyToOne(() => User)
  buyer: User;

  @Column({ type: 'float' })
  amount: number;

  @CreateDateColumn()
  created_at: Date;
}
