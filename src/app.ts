import 'reflect-metadata';
import { AppDataSource } from './database/db';
import { startServer } from './server';
import { setupScheduledEvents } from './scheduled/setupScheduledEvents';

const MAX_ATTEMPTS = 10;
const DELAY_MS = 3000; // 3 секунды

async function connectWithRetry() {
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
        throw error;
      }
    }
  }
  throw new Error('💥 Could not connect to database after multiple attempts');
}

async function bootstrap() {
  try {
    await connectWithRetry();

    await import('./bot/bot');
    console.log('✅ Telegram bot loaded');

    startServer();

    setupScheduledEvents();
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error during initialization:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('❌ Unknown error:', error);
    }
    process.exit(1); // чтобы контейнер упал и перезапустился автоматически (для продакшена)
  }
}

bootstrap();
