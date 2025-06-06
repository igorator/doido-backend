import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WithdrawBatch } from './WithdrawBatch';

export type WithdrawStatus =
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'failed'
  | 'waiting_refill';

@Entity()
export class WithdrawLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  to: string;

  @Column('decimal', { precision: 20, scale: 9 })
  amount: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: WithdrawStatus;

  @Column({ type: 'varchar', nullable: true })
  txHash?: string;

  @Column({ type: 'bigint' })
  createdAt: number;

  @Column({ type: 'bigint', nullable: true })
  processedAt?: number;

  @ManyToOne(() => WithdrawBatch, (batch) => batch.withdraws, {
    nullable: true,
  })
  @JoinColumn({ name: 'batchId' })
  batch?: WithdrawBatch;

  @Column({ type: 'int', nullable: true })
  batchId?: number;
}
