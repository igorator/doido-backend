import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WithdrawLog } from './WithdrawLog';

export type BatchStatus = 'pending' | 'processing' | 'confirmed' | 'failed' | 'waiting_refill';

@Entity()
export class WithdrawBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  createdAt: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: BatchStatus;

  @Column({ type: 'varchar', nullable: true })
  txHash?: string;

  @Column({ type: 'bigint', nullable: true })
  processedAt?: number;

  @OneToMany(() => WithdrawLog, (withdraw) => withdraw.batch, { cascade: true })
  withdraws: WithdrawLog[];
}
