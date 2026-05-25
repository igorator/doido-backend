import { num } from './_helpers';

export const serverConfig = {
  port: num(process.env.PORT ?? process.env.SERVER_PORT, 8080),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',
} as const;
