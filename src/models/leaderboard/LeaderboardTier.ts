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
  label: string; // например '101-200' или '501+'

  @Column('decimal', { precision: 20, scale: 8 })
  min_volume: string; // volume >= min_volume

  @Column('decimal', { precision: 20, scale: 8, nullable: true })
  max_volume: string | null; // volume < max_volume (или NULL для open-ended)

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
