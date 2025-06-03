// models/WithdrawBatch.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WithdrawLog } from './WithdrawLog';

@Entity()
export class WithdrawBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  createdAt: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'processing' | 'confirmed' | 'failed';

  @Column({ type: 'varchar', nullable: true })
  txHash?: string;

  @Column({ type: 'bigint', nullable: true })
  processedAt?: number; // unixtime, когда батч обработан

  @OneToMany(() => WithdrawLog, (withdraw) => withdraw.batch)
  withdraws: WithdrawLog[];
}
