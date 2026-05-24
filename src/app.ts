import 'reflect-metadata';
import { AppDataSource } from './database/db';
import { startServer } from './server';
import { setupScheduledEvents } from './scheduled/setupScheduledEvents';

const DB = {
  maxAttempts: 10,
  retryMs: 3_000,
  outerRetryMs: 15_000,
} as const;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableDbError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes('starting up') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('self-signed certificate')
  );
};

async function connectToDatabase(): Promise<void> {
  for (let attempt = 1; attempt <= DB.maxAttempts; attempt++) {
    try {
      console.log(`🔄 Connecting to database (attempt ${attempt}/${DB.maxAttempts})...`);
      await AppDataSource.initialize();
      console.log('📦 Database connected');
      return;
    } catch (error) {
      if (!isRetryableDbError(error)) {
        console.error('❌ Unexpected DB connection error:', error);
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⏳ DB not ready: ${message}. Retrying in ${DB.retryMs / 1_000}s...`);
      await sleep(DB.retryMs);
    }
  }

  throw new Error(`💥 Could not connect to database after ${DB.maxAttempts} attempts`);
}

async function connectWithRetryLoop(): Promise<void> {
  while (true) {
    try {
      await connectToDatabase();
      return;
    } catch {
      console.error('💥 DB still unavailable. Retrying in 15s...');
      await sleep(DB.outerRetryMs);
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

  await connectWithRetryLoop();

  await import('./bot/bot');
  console.log('✅ Telegram bot loaded');

  startServer();
  setupScheduledEvents();
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error during bootstrap:', error);
  process.exit(1);
});
