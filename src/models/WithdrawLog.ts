import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type WithdrawStatus = 'pending' | 'confirmed' | 'failed';

@Entity()
export class WithdrawLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  to: string;

  @Column('decimal', { precision: 20, scale: 9 })
  amount: string;

  @Column({ type: 'varchar' })
  status: WithdrawStatus;

  @Column({ nullable: true })
  txHash?: string;

  @Column({ type: 'bigint' })
  createdAt: number;

  @Column({ type: 'bigint', nullable: true })
  processedAt?: number;
}
