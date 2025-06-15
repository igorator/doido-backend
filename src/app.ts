import 'reflect-metadata';
import { AppDataSource } from './database/db';
import { startServer } from './server';
import { setupScheduledEvents } from './scheduled/setupScheduledEvents';

const MAX_ATTEMPTS = 10;
const DELAY_MS = 3000;

async function connectWithRetry(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(
        `🔄 Connecting to database (attempt ${attempt}/${MAX_ATTEMPTS})...`,
      );
      await AppDataSource.initialize();
      console.log('📦 Database connected');
      return;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message &&
        (error.message.includes('starting up') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('self-signed certificate'))
      ) {
        console.warn(
          `⏳ DB not ready: ${error.message}. Retrying in ${
            DELAY_MS / 1000
          }s...`,
        );
        await new Promise((res) => setTimeout(res, DELAY_MS));
      } else {
        console.error('❌ Unexpected DB connection error:', error);
        throw error;
      }
    }
  }
  throw new Error('💥 Could not connect to database after max attempts');
}

async function connectWithRetryLoop(): Promise<void> {
  while (true) {
    try {
      await connectWithRetry();
      break;
    } catch (err) {
      console.error('💥 DB still unavailable. Will retry after delay...');
      await new Promise((res) => setTimeout(res, DELAY_MS * 5));
    }
  }
}

async function bootstrap(): Promise<void> {
  await connectWithRetryLoop();

  try {
    await import('./bot/bot');
    console.log('✅ Telegram bot loaded');

    startServer();

    setupScheduledEvents();
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    console.error(
      '⚠️ App will continue running and retry DB connection if needed.',
    );
  }
}

bootstrap();
