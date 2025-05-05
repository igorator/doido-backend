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

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'enum', enum: ['gift', 'sticker'] })
  item_type: ActivityItemType;

  @Column('text')
  item_id: string;

  @Column({ type: 'jsonb' })
  item_snapshot: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column({ type: 'float' })
  amount: number;

  @CreateDateColumn()
  created_at: Date;
}
