import 'reflect-metadata';
import { AppDataSource } from './database/db';
import { login } from './telegram/tdClient';
import { setupTelegramListeners } from './telegram/listeners/onUpdateListener';

async function bootstrap() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('📦 Database connected');

    console.log('🔄 Logging in to Telegram...');
    await login();
    console.log('✅ Logged in to Telegram');

    console.log('🔄 Setting up gift update listener...');

    setupTelegramListeners();

    console.log('✅ Listening for gift-related messages...');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error during bot initialization:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('❌ Unknown error during bot initialization:', error);
    }
  }
}

bootstrap();
