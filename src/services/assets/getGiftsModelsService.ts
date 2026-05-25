import fs from 'fs/promises';
import path from 'path';
import { AppDataSource } from '../../database/db';
import { Gift, GiftStatus } from '../../models/Gift';
import { createHttpError } from '../../shared/lib/httpError';

interface ModelFileEntry {
  name: string;
  rarityPermille: number;
}

export interface ModelResult {
  id: string;
  name: string;
  rarity: number;
  image: string;
  itemCount?: number;
  floorPrice?: number;
}

interface ModelStats {
  itemCount: number;
  floorPrice: number;
}

const modelsCache = new Map<string, ModelResult[]>();

const getModelJsonPath = (collectionName: string) =>
  path.resolve(process.cwd(), 'assets/gifts/models', collectionName, 'sorted.json');

const getModelImagePath = (collectionName: string, modelName: string) =>
  `/assets/gifts/models/${encodeURIComponent(collectionName)}/png/${encodeURIComponent(modelName)}.png`;

export async function getGiftsModelsService(collections: string[]): Promise<ModelResult[]> {
  const rawStats = await AppDataSource.getRepository(Gift)
    .createQueryBuilder('gift')
    .select('gift.collection_name', 'collectionName')
    .addSelect('gift."modelName"', 'modelName')
    .addSelect('COUNT(*)', 'itemCount')
    .addSelect('MIN(gift.sell_price)', 'floorPrice')
    .where('gift.status = :status', { status: GiftStatus.LISTED })
    .andWhere('gift.collection_name IN (:...collections)', { collections })
    .groupBy('gift.collection_name')
    .addGroupBy('gift."modelName"')
    .getRawMany<{
      collectionName: string;
      modelName: string;
      itemCount: string;
      floorPrice: string;
    }>();

  const statMap = new Map<string, ModelStats>();
  for (const stat of rawStats) {
    statMap.set(`${stat.collectionName}:${stat.modelName}`, {
      itemCount: Number(stat.itemCount),
      floorPrice: Number(stat.floorPrice),
    });
  }

  const results = await Promise.all(
    collections.map(async (collectionName) => {
      if (modelsCache.has(collectionName)) {
        return modelsCache.get(collectionName)!;
      }

      const filePath = getModelJsonPath(collectionName);
      let fileData: string;
      try {
        fileData = await fs.readFile(filePath, 'utf-8');
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          throw createHttpError(`Models not found for collection: ${collectionName}`, 404);
        }
        throw err;
      }
      const data: ModelFileEntry[] = JSON.parse(fileData);

      const models: ModelResult[] = data.map((modelEntry) => {
        const key = `${collectionName}:${modelEntry.name}`;
        const stat = statMap.get(key);

        const base: ModelResult = {
          id: key,
          name: modelEntry.name,
          rarity: modelEntry.rarityPermille,
          image: getModelImagePath(collectionName, modelEntry.name),
        };

        if (stat && stat.itemCount > 0) {
          return { ...base, itemCount: stat.itemCount, floorPrice: stat.floorPrice };
        }

        return base;
      });

      modelsCache.set(collectionName, models);
      return models;
    }),
  );

  return results.flat();
}
