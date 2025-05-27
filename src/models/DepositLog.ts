import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DepositLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  txHash: string;

  @Column()
  userId: string;

  @Column('decimal', { precision: 20, scale: 8, default: 0.0 })
  amount: string;

  @Column()
  timestamp: number;
}
