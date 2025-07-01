import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum GiftOrderStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class GiftOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 20 })
  userId: string;

  @Column('varchar', { length: 64, nullable: true })
  collectionName: string | null;

  @Column('varchar', { length: 64, nullable: true })
  modelName: string | null;

  @Column('varchar', { length: 64, nullable: true })
  backdropName: string | null;

  @Column('varchar', { length: 64, nullable: true })
  patternName: string | null;

  @Column('decimal', { precision: 20, scale: 8 })
  maxPrice: string;

  @Column('int')
  quantity: number;

  @Column('int', { default: 0 })
  filledQuantity: number;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  balanceLocked: string;

  @Column({
    type: 'enum',
    enum: GiftOrderStatus,
    default: GiftOrderStatus.ACTIVE,
  })
  status: GiftOrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
