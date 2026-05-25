import {
  FindOptionsWhere,
  FindOptionsOrder,
  Like,
  In,
  MoreThanOrEqual,
  LessThanOrEqual,
  Between,
} from 'typeorm';
import { giftRepository } from '../../database/repositories/giftRepository';
import { Gift, GiftStatus } from '../../models/Gift';

export interface GetGiftsQuery {
  collections: string[];
  models: string[];
  backdrops: string[];
  patterns: string[];
  minPrice?: string;
  maxPrice?: string;
  sort: string;
  giftNumber?: number;
  skip: number;
  take: number;
}

export interface GetGiftsResult {
  gifts: Gift[];
  total: number;
  hasMore: boolean;
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

export async function getGiftsService(query: GetGiftsQuery): Promise<GetGiftsResult> {
  const {
    collections,
    models,
    backdrops,
    patterns,
    minPrice,
    maxPrice,
    sort,
    giftNumber,
    skip,
    take,
  } = query;

  const baseFilters: FindOptionsWhere<Gift> = {
    status: GiftStatus.LISTED,
    ...(giftNumber !== undefined && { number: giftNumber }),
  };

  if (minPrice && maxPrice) {
    baseFilters.sell_price_with_fee = Between(minPrice, maxPrice) as never;
  } else if (minPrice) {
    baseFilters.sell_price_with_fee = MoreThanOrEqual(minPrice) as never;
  } else if (maxPrice) {
    baseFilters.sell_price_with_fee = LessThanOrEqual(maxPrice) as never;
  }

  const attributeFilters: FindOptionsWhere<Gift> = {
    ...(models.length && { model: { name: In(models) } }),
    ...(backdrops.length && { backdrop: { name: In(backdrops) } }),
    ...(patterns.length && { pattern: { name: In(patterns) } }),
  };

  const where: FindOptionsWhere<Gift>[] = collections.length
    ? collections.map((collectionName) => ({
        ...baseFilters,
        ...attributeFilters,
        collection_name: Like(`%${collectionName}%`),
      }))
    : [{ ...baseFilters, ...attributeFilters }];

  const [gifts, total] = await giftRepository.findAndCount({
    where,
    order: buildSortOrder(sort),
    relations: ['owner'],
    skip,
    take,
  });

  return { gifts, total, hasMore: skip + take < total };
}
