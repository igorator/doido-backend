import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

export type DepositStatus = 'pending' | 'confirmed' | 'failed' | 'expired';

@Entity()
@Index(['payload'], { unique: true })
export class DepositLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  payload: string;

  @Column({ type: 'decimal', precision: 30, scale: 0 })
  amountNano: string;

  @Column({ type: 'bigint' })
  timestamp: number;

  @Column({ type: 'varchar', length: 12, default: 'pending' })
  status: DepositStatus;

  @Column({ type: 'bigint', nullable: true })
  utime: number | null;

  // ↓↓↓ Обязательно! Logical time (уникальный для транзакции)
  @Column({ type: 'varchar', length: 32, nullable: true })
  lt: string | null;
}
