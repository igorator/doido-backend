import 'reflect-metadata';
import { AppDataSource } from './database/db';
import { login } from './telegram/tdClient';
import { setupTelegramListeners } from './telegram/listeners/onUpdateListener';
import { startServer } from './server';

async function bootstrap() {
  try {
    startServer();
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('📦 Database connected');

    console.log('🔄 Logging in to Telegram...');
    await login();
    console.log('✅ Logged in to Telegram');

    console.log('🔄 Setting up Telegram listeners...');
    setupTelegramListeners();
    console.log('✅ Telegram listeners initialized');
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
