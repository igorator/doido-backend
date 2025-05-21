import { DecimalTransformer } from '../shared/lib/transformers/decimalToNumber';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Gift } from './Gift';
import type Decimal from 'decimal.js';

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
    eager: true,
  })
  gift?: Gift;

  // Можно добавить в будущем:
  // @ManyToOne(() => Sticker, { nullable: true, onDelete: 'SET NULL' })
  // sticker?: Sticker;

  @ManyToOne(() => User, { nullable: false })
  seller: User;

  @ManyToOne(() => User, { nullable: false })
  buyer: User;

  @Column('decimal', {
    precision: 20,
    scale: 8,
    default: 0.0,
    transformer: DecimalTransformer,
  })
  amount: Decimal;

  @CreateDateColumn()
  created_at: Date;

  toJSON() {
    const { amount, gift, seller, buyer, ...rest } = this;

    return {
      ...rest,
      amount: amount?.toNumber?.() ?? 0,
      gift: gift?.toJSON?.() ?? gift,
      seller_id: seller?.id,
      buyer_id: buyer?.id,
    };
  }
}
