import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';

export type ActivityItemType = 'gift' | 'sticker';
export type ActivityAction = 'buy' | 'sell';

@Entity('activity')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['gift', 'sticker'] })
  item_type: ActivityItemType;

  @Column()
  item_id: number;

  @Column({ type: 'jsonb' })
  item_snapshot: Record<string, any>;

  @Column({ type: 'enum', enum: ['buy', 'sell'] })
  action: ActivityAction;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column({ type: 'float' })
  amount: number;

  @CreateDateColumn()
  created_at: Date;
}
