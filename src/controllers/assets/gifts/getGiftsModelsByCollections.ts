import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { AppDataSource } from '../../../database/db';
import { Gift, GiftStatus } from '../../../models/Gift';

const modelsCache = new Map<string, any[]>();

const getModelJsonPath = (name: string) =>
  path.resolve(process.cwd(), 'assets/gifts/models', name, 'sorted.json');

const getModelImagePath = (name: string, modelName: string) =>
  `/assets/gifts/models/${encodeURIComponent(name)}/png/${encodeURIComponent(
    modelName,
  )}.png`;

export const getGiftsModelsByCollections = async (
  req: Request,
  res: Response,
) => {
  const collectionsParam = req.query.collections;

  const collections = Array.isArray(collectionsParam)
    ? collectionsParam
        .map(String)
        .map((c) => c.trim())
        .filter(Boolean)
    : typeof collectionsParam === 'string'
    ? collectionsParam
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  if (collections.length === 0) {
    res.json([]);
    return;
  }

  try {
    // Берём статистику из базы по моделям
    const stats = await AppDataSource.getRepository(Gift)
      .createQueryBuilder('gift')
      .select('gift.collection_name', 'collectionName')
      .addSelect('gift."modelName"', 'modelName') // Обрати внимание на кавычки
      .addSelect('COUNT(*)', 'itemCount')
      .addSelect('MIN(gift.sell_price)', 'floorPrice')
      .where('gift.status = :status', { status: GiftStatus.LISTED })
      .andWhere('gift.collection_name IN (:...collections)', { collections })
      .groupBy('gift.collection_name')
      .addGroupBy('gift."modelName"')
      .getRawMany();

    const statMap = new Map<
      string,
      { itemCount: number; floorPrice: number }
    >();

    stats.forEach((s) => {
      const key = `${s.collectionName}:${s.modelName}`;
      statMap.set(key, {
        itemCount: Number(s.itemCount),
        floorPrice: Number(s.floorPrice),
      });
    });

    const results = await Promise.all(
      collections.map(async (collectionName) => {
        if (modelsCache.has(collectionName)) {
          return modelsCache.get(collectionName)!;
        }

        const filePath = getModelJsonPath(collectionName);
        try {
          const fileData = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(fileData);

          const models = data.map((model: any) => {
            const key = `${collectionName}:${model.name}`;
            const stat = statMap.get(key);

            const base = {
              id: key,
              name: model.name,
              rarity: model.rarityPermille,
              image: getModelImagePath(collectionName, model.name),
            };

            if (stat && stat.itemCount > 0) {
              return {
                ...base,
                itemCount: stat.itemCount,
                floorPrice: stat.floorPrice,
              };
            }

            return base;
          });

          modelsCache.set(collectionName, models);
          return models;
        } catch (e: any) {
          console.warn(
            `⚠️ Не удалось загрузить ${collectionName}: ${e.message}`,
          );
          return [];
        }
      }),
    );

    res.json(results.flat());
  } catch (err) {
    console.error('❌ Ошибка в getGiftsModelsByCollections:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
