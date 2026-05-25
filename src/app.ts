import 'reflect-metadata';
import { AppDataSource } from './database/db';
import { startServer } from './server';
import { setupScheduledEvents } from './scheduled/setupScheduledEvents';

const DB_MAX_ATTEMPTS = 10;
const DB_RETRY_MS = 3_000;
const DB_OUTER_MAX_ATTEMPTS = 5;
const DB_OUTER_RETRY_MS = 15_000;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

class DbRetryExhaustedError extends Error {}

function isRetryableDbError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes('starting up') || error.message.includes('ECONNREFUSED');
}

async function connectToDatabase(): Promise<void> {
  for (let attempt = 1; attempt <= DB_MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`🔄 Connecting to database (attempt ${attempt}/${DB_MAX_ATTEMPTS})...`);
      await AppDataSource.initialize();
      console.log('📦 Database connected');
      return;
    } catch (error) {
      if (!isRetryableDbError(error)) {
        console.error('❌ Unexpected DB connection error:', error);
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⏳ DB not ready: ${message}. Retrying in ${DB_RETRY_MS / 1_000}s...`);
      await sleep(DB_RETRY_MS);
    }
  }

  throw new DbRetryExhaustedError(
    `💥 Could not connect to database after ${DB_MAX_ATTEMPTS} attempts`,
  );
}

async function connectWithRetry(): Promise<void> {
  for (let outerAttempt = 1; outerAttempt <= DB_OUTER_MAX_ATTEMPTS; outerAttempt++) {
    try {
      await connectToDatabase();
      return;
    } catch (err) {
      if (!(err instanceof DbRetryExhaustedError)) {
        throw err;
      }

      if (outerAttempt >= DB_OUTER_MAX_ATTEMPTS) {
        throw new Error(
          `💥 Database unavailable after ${DB_OUTER_MAX_ATTEMPTS} outer retries. Exiting.`,
        );
      }

      console.error(
        `💥 DB still unavailable. Outer attempt ${outerAttempt}/${DB_OUTER_MAX_ATTEMPTS}.` +
          ` Retrying in ${DB_OUTER_RETRY_MS / 1_000}s...`,
      );
      await sleep(DB_OUTER_RETRY_MS);
    }
  }
}

function registerShutdownHandlers(): void {
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('📦 Database connection closed');
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

async function bootstrap(): Promise<void> {
  registerShutdownHandlers();

  await connectWithRetry();

  await import('./bot/bot');
  console.log('✅ Telegram bot loaded');

  startServer();
  setupScheduledEvents();
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during bootstrap:', error);
  process.exit(1);
});
