import { AppDataSource } from './src/database/db';

export const migrateGiftStatus = async () => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  console.log('🔄 Starting gift status migration...');

  try {
    // 1. Добавляем колонку status, если вдруг её ещё нет
    await queryRunner.query(`
      ALTER TABLE "gift"
      ADD COLUMN IF NOT EXISTS "status" VARCHAR DEFAULT 'unlisted'
    `);
    console.log('✅ Added status column');

    // ⚠️ Удаляем обновление по is_listed – оно уже не нужно

    // 2. Удаляем колонку is_listed, если она каким-то образом ещё есть
    await queryRunner.query(`
      ALTER TABLE "gift" DROP COLUMN IF EXISTS "is_listed"
    `);
    console.log('🧹 Removed is_listed column');

    console.log('🎉 Migration complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await queryRunner.release();
  }
};
