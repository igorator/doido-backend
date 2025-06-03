import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type DepositStatus = 'pending' | 'confirmed' | 'failed';

@Entity()
export class DepositLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'decimal', precision: 20, scale: 9 })
  amount: string;

  @Column({ type: 'varchar', nullable: true })
  txHash?: string;

  @Column({ type: 'bigint' })
  timestamp: number;

  @Column({ type: 'varchar', default: 'confirmed' })
  status: DepositStatus;
}
