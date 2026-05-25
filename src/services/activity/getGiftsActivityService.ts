import { FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { AppDataSource } from '../../database/db';
import { Activity, ActivityItemType } from '../../models/Activity';

export interface GetGiftsActivityQuery {
  collections: string[];
  models: string[];
  backdrops: string[];
  patterns: string[];
  giftNumber?: number;
  minPrice?: number;
  maxPrice?: number;
  skip: number;
  take: number;
}

export interface ActivityPage {
  activities: Activity[];
  total: number;
  hasMore: boolean;
}

export async function getGiftsActivityService(query: GetGiftsActivityQuery): Promise<ActivityPage> {
  const { collections, models, backdrops, patterns, giftNumber, minPrice, maxPrice, skip, take } =
    query;

  const baseWhere: FindOptionsWhere<Activity> = {
    item_type: ActivityItemType.GIFT,
    ...(collections.length && { gift_collection_name: In(collections) }),
    ...(models.length && { gift_model_name: In(models) }),
    ...(backdrops.length && { gift_backdrop_name: In(backdrops) }),
    ...(patterns.length && { gift_pattern_name: In(patterns) }),
    ...(giftNumber !== undefined && { gift_number: giftNumber }),
  };

  if (minPrice !== undefined && maxPrice !== undefined) {
    baseWhere.amount = Between(minPrice, maxPrice) as never;
  } else if (minPrice !== undefined) {
    baseWhere.amount = MoreThanOrEqual(minPrice) as never;
  } else if (maxPrice !== undefined) {
    baseWhere.amount = LessThanOrEqual(maxPrice) as never;
  }

  const [activities, total] = await AppDataSource.getRepository(Activity).findAndCount({
    where: baseWhere,
    relations: ['seller', 'buyer'],
    order: { created_at: 'DESC' },
    skip,
    take,
  });

  return { activities, total, hasMore: skip + take < total };
}
