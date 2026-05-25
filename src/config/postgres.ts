import { num } from './_helpers';

export const postgresConfig = {
  host: process.env.POSTGRES_HOST ?? '',
  port: num(process.env.POSTGRES_PORT, 5432),
  user: process.env.POSTGRES_USER ?? '',
  password: process.env.POSTGRES_PASSWORD ?? '',
  database: process.env.POSTGRES_DB ?? '',
} as const;
