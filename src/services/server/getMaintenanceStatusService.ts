import { AppDataSource } from '../../database/db';
import { AppSettings } from '../../models/AppSettings';

export async function getMaintenanceStatusService(): Promise<boolean> {
  const settings = await AppDataSource.getRepository(AppSettings).findOne({
    where: { id: 1 },
  });
  return settings?.is_maintenance ?? false;
}
