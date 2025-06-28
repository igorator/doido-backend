import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User';
import { DecimalTransformer } from '../shared/lib/transformers/decimalToNumber';
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

  // 🎁 Gift metadata (всё отдельными полями)
  @Column('varchar', { length: 50, nullable: true })
  gift_collection_name?: string;

  @Column('int', { nullable: true })
  gift_number?: number;

  @Column('varchar', { length: 50, nullable: true })
  gift_model_name?: string;

  @Column('decimal', {
    precision: 10,
    scale: 6,
    nullable: true,
  })
  gift_model_rarity?: number;

  @Column('varchar', { length: 8, nullable: true })
  gift_model_emoji?: string;

  @Column('varchar', { length: 50, nullable: true })
  gift_pattern_name?: string;

  @Column('decimal', {
    precision: 10,
    scale: 6,
    nullable: true,
  })
  gift_pattern_rarity?: number;

  @Column('varchar', { length: 8, nullable: true })
  gift_pattern_emoji?: string;

  @Column('varchar', { length: 50, nullable: true })
  gift_backdrop_name?: string;

  @Column('decimal', {
    precision: 10,
    scale: 6,
    nullable: true,
  })
  gift_backdrop_rarity?: number;

  @Column('varchar', { length: 12, nullable: true })
  gift_backdrop_center_color?: string;

  @Column('varchar', { length: 12, nullable: true })
  gift_backdrop_edge_color?: string;

  @Column('varchar', { length: 12, nullable: true })
  gift_backdrop_symbol_color?: string;

  @Column('varchar', { length: 12, nullable: true })
  gift_backdrop_text_color?: string;

  // 🧑‍🤝‍🧑 Users
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  seller: User;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  buyer: User;

  // 💰 Amount
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
    const { seller, buyer, amount, ...rest } = this;

    return {
      id: this.id,
      item_type: this.item_type,
      item_id: this.item_id,
      amount: amount?.toNumber() ?? 0,
      created_at: this.created_at,
      seller_id: seller?.id,
      buyer_id: buyer?.id,
      gift: {
        collection_name: this.gift_collection_name,
        number: this.gift_number,
        model: {
          name: this.gift_model_name,
          rarity: this.gift_model_rarity,
          emoji: this.gift_model_emoji,
        },
        pattern: {
          name: this.gift_pattern_name,
          rarity: this.gift_pattern_rarity,
          emoji: this.gift_pattern_emoji,
        },
        backdrop: {
          name: this.gift_backdrop_name,
          rarity: this.gift_backdrop_rarity,
          center_color: this.gift_backdrop_center_color,
          edge_color: this.gift_backdrop_edge_color,
          symbol_color: this.gift_backdrop_symbol_color,
          text_color: this.gift_backdrop_text_color,
        },
      },
    };
  }
}
