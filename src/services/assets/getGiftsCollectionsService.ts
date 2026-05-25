import fs from 'fs/promises';
import path from 'path';
import { AppDataSource } from '../../database/db';
import { Gift, GiftStatus } from '../../models/Gift';

interface CollectionStats {
  count: number;
  floorPrice?: number;
}

export interface CollectionResult {
  id: string;
  name: string;
  image: string;
  itemCount?: number;
  floorPrice?: number;
}

const filePath = path.resolve(process.cwd(), 'assets/gifts/id-to-name.json');
const CACHE_TTL_MS = 30_000;

let cache: { data: CollectionResult[]; updatedAt: number } | null = null;

export async function getGiftsCollectionsService(): Promise<CollectionResult[]> {
  if (cache && Date.now() - cache.updatedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const fileData = await fs.readFile(filePath, 'utf-8');
  const raw: Record<string, string> = JSON.parse(fileData);

  const stats = await AppDataSource.getRepository(Gift)
    .createQueryBuilder('gift')
    .select('gift.collection_name', 'collectionName')
    .addSelect('COUNT(*)', 'count')
    .addSelect('MIN(gift.sell_price)', 'floorPrice')
    .where('gift.status = :status', { status: GiftStatus.LISTED })
    .groupBy('gift.collection_name')
    .getRawMany<{ collectionName: string; count: string; floorPrice: string | null }>();

  const statsMap = new Map<string, CollectionStats>();
  for (const stat of stats) {
    statsMap.set(stat.collectionName, {
      count: Number(stat.count),
      floorPrice: stat.floorPrice !== null ? Number(stat.floorPrice) : undefined,
    });
  }

  const result: CollectionResult[] = Object.entries(raw)
    .map(([id, name]) => {
      const base: CollectionResult = {
        id,
        name,
        image: `/assets/gifts/originals/${encodeURIComponent(id)}/Original.png`,
      };

      const stat = statsMap.get(name);
      if (stat && stat.count > 0) {
        return {
          ...base,
          itemCount: stat.count,
          floorPrice:
            stat.floorPrice !== undefined ? Number(stat.floorPrice.toFixed(2)) : undefined,
        };
      }

      return base;
    })
    .sort((collectionA, collectionB) => collectionA.name.localeCompare(collectionB.name));

  cache = { data: result, updatedAt: Date.now() };
  return result;
}
