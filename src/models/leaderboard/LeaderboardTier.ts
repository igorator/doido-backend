import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { LeaderboardType } from './LeaderboardType';

@Entity()
export class LeaderboardTier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: LeaderboardType,
  })
  type: LeaderboardType;

  @Column('varchar', { length: 20 })
  label: string;

  @Column('decimal', { precision: 20, scale: 8 })
  min_volume: string;

  @Column('decimal', { precision: 20, scale: 8, nullable: true })
  max_volume: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
