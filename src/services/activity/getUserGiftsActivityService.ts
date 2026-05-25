import { AppDataSource } from '../../database/db';
import { Activity, ActivityItemType } from '../../models/Activity';

export interface ActivityPage {
  activities: Activity[];
  total: number;
  hasMore: boolean;
}

export async function getUserGiftsActivityService(
  userId: string,
  skip: number,
  take: number,
): Promise<ActivityPage> {
  const [activities, total] = await AppDataSource.getRepository(Activity).findAndCount({
    where: [
      { item_type: ActivityItemType.GIFT, buyer: { id: userId } },
      { item_type: ActivityItemType.GIFT, seller: { id: userId } },
    ],
    relations: ['buyer', 'seller'],
    order: { created_at: 'DESC' },
    skip,
    take,
  });

  return { activities, total, hasMore: skip + take < total };
}
