import { AppDataSource } from '../../database/db';
import { giftRepository } from '../../database/repositories/giftRepository';

export const migrateGiftStatus = async () => {
  try {
    console.log('🔄 Starting gift status migration...');
    await AppDataSource.initialize();

    // 1. Добавляем колонку status, если её ещё нет
    await AppDataSource.query(`
      ALTER TABLE "gift"
      ADD COLUMN IF NOT EXISTS "status" VARCHAR DEFAULT 'unlisted'
    `);
    console.log('✅ Added status column');

    // 2. Обновляем status по текущему is_listed
    await AppDataSource.query(`
      UPDATE "gift" SET "status" = 'listed' WHERE "is_listed" = true
    `);

    await AppDataSource.query(`
      UPDATE "gift" SET "status" = 'unlisted' WHERE "is_listed" = false
    `);
    console.log('✅ Updated status values');

    // 3. Удаляем старую колонку is_listed
    await AppDataSource.query(`
      ALTER TABLE "gift" DROP COLUMN IF EXISTS "is_listed"
    `);
    console.log('🧹 Removed is_listed column');

    await AppDataSource.destroy();
    console.log('🎉 Migration complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

migrateGiftStatus();
