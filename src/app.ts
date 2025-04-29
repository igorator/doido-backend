import 'reflect-metadata';
import { AppDataSource } from './database/db';
import { login } from './telegram/tdClient';
import { setupTelegramListeners } from './telegram/listeners/onUpdateListener';
import { startServer } from './server';
import { initializeBotUserId } from './telegram/config/botInstanse';

async function bootstrap() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('📦 Database connected');

    console.log('🔄 Logging in to Telegram...');
    await login();
    console.log('✅ Logged in to Telegram');

    console.log('🔄 Initializing bot user ID...');
    await initializeBotUserId();
    console.log('✅ Bot user ID initialized');

    console.log('🔄 Setting up Telegram listeners...');
    setupTelegramListeners();
    console.log('✅ Telegram listeners initialized');

    startServer();
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
