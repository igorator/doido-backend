import { DataSource } from 'typeorm';
import { config } from '../config';
import { Gift } from '../models/Gift';
import { User } from '../models/User';
import { Activity } from '../models/Activity';
import { DepositLog } from '../models/ton/DepositLog';
import { WithdrawBatch } from '../models/ton/WithdrawBatch';
import { WithdrawLog } from '../models/ton/WithdrawLog';
import { LeaderboardEntry } from '../models/leaderboard/Leaderboard';
import { LeaderboardTier } from '../models/leaderboard/LeaderboardTier';
import { AppSettings } from '../models/AppSettings';
import { MarketInfo } from '../models/MarketInfo';
import { GiftOrder } from '../models/orders/GiftOrder';

const { host, port, user, password, database } = config.postgres;

if (!host || !user || !password || !database) {
  throw new Error(
    'Переменные окружения для базы данных не заданы полностью ' +
      '(POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)',
  );
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host,
  port,
  username: user,
  password,
  database,
  entities: [
    Gift,
    User,
    Activity,
    WithdrawLog,
    DepositLog,
    WithdrawBatch,
    LeaderboardEntry,
    LeaderboardTier,
    AppSettings,
    MarketInfo,
    GiftOrder,
  ],
  ssl: { rejectUnauthorized: false },
  logging: false,
  synchronize: false,
});
