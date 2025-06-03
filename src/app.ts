import 'reflect-metadata';
import { AppDataSource } from './database/db';
import { startServer } from './server';
import { setupScheduledEvents } from './scheduled/setupScheduledEvents';

async function bootstrap() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('📦 Database connected');

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
  }
}

bootstrap();
