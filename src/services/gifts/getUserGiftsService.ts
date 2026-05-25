import {
  FindOptionsOrder,
  FindOptionsWhere,
  In,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  Like,
} from 'typeorm';
import { giftRepository } from '../../database/repositories/giftRepository';
import { Gift, GiftStatus } from '../../models/Gift';

export interface GetUserGiftsQuery {
  userId: string;
  collections: string[];
  models: string[];
  backdrops: string[];
  patterns: string[];
  minPrice?: string;
  maxPrice?: string;
  sort: string;
  giftNumber?: number;
}

export interface GetUserGiftsResult {
  listedGifts: Gift[];
  unlistedGifts: Gift[];
  listedCount: number;
  unlistedCount: number;
  total: number;
}

function buildSortOrder(sort: string): FindOptionsOrder<Gift> {
  switch (sort) {
    case 'price-asc':
      return { sell_price: 'asc' };
    case 'price-desc':
      return { sell_price: 'desc' };
    case 'id-asc':
      return { number: 'asc' };
    case 'id-desc':
      return { number: 'desc' };
    default:
      return { updated_at: 'desc' };
  }
}

export async function getUserGiftsService(query: GetUserGiftsQuery): Promise<GetUserGiftsResult> {
  const { userId, collections, models, backdrops, patterns, minPrice, maxPrice, sort, giftNumber } =
    query;

  const baseFilters: FindOptionsWhere<Gift> = {
    owner: { id: userId },
    ...(giftNumber !== undefined && { number: giftNumber }),
  };

  if (minPrice && maxPrice) {
    baseFilters.sell_price = Between(minPrice, maxPrice) as never;
  } else if (minPrice) {
    baseFilters.sell_price = MoreThanOrEqual(minPrice) as never;
  } else if (maxPrice) {
    baseFilters.sell_price = LessThanOrEqual(maxPrice) as never;
  }

  const attributeFilters: FindOptionsWhere<Gift> = {
    ...(models.length && { model: { name: In(models) } }),
    ...(backdrops.length && { backdrop: { name: In(backdrops) } }),
    ...(patterns.length && { pattern: { name: In(patterns) } }),
  };

  const buildWhereClause = (status: GiftStatus): FindOptionsWhere<Gift>[] =>
    collections.length
      ? collections.map((collectionName) => ({
          ...baseFilters,
          ...attributeFilters,
          status,
          collection_name: Like(`%${collectionName}%`),
        }))
      : [{ ...baseFilters, ...attributeFilters, status }];

  const order = buildSortOrder(sort);

  const [listedGifts, unlistedGifts] = await Promise.all([
    giftRepository.find({ where: buildWhereClause(GiftStatus.LISTED), order }),
    giftRepository.find({ where: buildWhereClause(GiftStatus.UNLISTED), order }),
  ]);

  return {
    listedGifts,
    unlistedGifts,
    listedCount: listedGifts.length,
    unlistedCount: unlistedGifts.length,
    total: listedGifts.length + unlistedGifts.length,
  };
}
