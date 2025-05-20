import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Gift } from '../models/Gift';
import { User } from '../models/User';
import { Activity } from '../models/Activity';
import { MinimalLogger } from './logger/logger';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

const isProduction = process.env.NODE_ENV === 'production';

if (
  !process.env.POSTGRES_HOST ||
  !process.env.POSTGRES_USER ||
  !process.env.POSTGRES_PASSWORD ||
  !process.env.POSTGRES_DB
) {
  throw new Error('Переменные окружения для базы данных не заданы полностью');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [Gift, User, Activity],
  logging: true,
  logger: new MinimalLogger(),
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});
