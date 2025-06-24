import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../User';
import { LeaderboardType } from './LeaderboardType';

@Entity()
export class LeaderboardEntry {
  @PrimaryColumn('varchar', { length: 20 })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @PrimaryColumn({
    type: 'enum',
    enum: LeaderboardType,
  })
  type: LeaderboardType;

  @Column('int')
  rank: number;

  @Column('varchar', { length: 20 })
  range: '1-100' | '101-200' | '201-500' | '500+';

  @Column('decimal', { precision: 20, scale: 8 })
  volume: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  updated_at: Date;
}
