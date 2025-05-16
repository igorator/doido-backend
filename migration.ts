import { AppDataSource } from './src/database/db';

export const migrateGiftStatus = async () => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  console.log('🔄 Starting gift status migration...');

  try {
    // 1. Добавляем колонку status, если нет
    await queryRunner.query(`
      ALTER TABLE "gift"
      ADD COLUMN IF NOT EXISTS "status" VARCHAR DEFAULT 'unlisted'
    `);
    console.log('✅ Added status column');

    // 2. Обновляем значения статуса на основе is_listed
    await queryRunner.query(`
      UPDATE "gift" SET "status" = 'listed' WHERE "is_listed" = true
    `);
    await queryRunner.query(`
      UPDATE "gift" SET "status" = 'unlisted' WHERE "is_listed" = false
    `);
    console.log('✅ Updated status values');

    // 3. Удаляем колонку is_listed
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
