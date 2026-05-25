import './env';

import { serverConfig } from './server';
import { telegramConfig } from './telegram';
import { postgresConfig } from './postgres';
import { tonConfig } from './ton';
import { feesConfig } from './fees';
import { limitsConfig } from './limits';
import { starsConfig } from './stars';
import { cronConfig } from './cron';

export const config = {
  server: serverConfig,
  telegram: telegramConfig,
  postgres: postgresConfig,
  ton: tonConfig,
  fees: feesConfig,
  limits: limitsConfig,
  stars: starsConfig,
  cron: cronConfig,
} as const;
