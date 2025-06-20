import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

let cachedBackdrops: any[] | null = null;

const defaultFilePath = path.resolve(
  process.cwd(),
  'assets/gifts/backdrops.json',
);

const getCollectionBackdropPath = (collectionName: string) =>
  path.resolve(
    process.cwd(),
    'assets/gifts/backdrops',
    collectionName,
    'backdrops.json',
  );

export const getGiftsBackdrops = async (req: Request, res: Response) => {
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

  try {
    if (collections.length === 1) {
      const collectionName = collections[0];
      const filePath = getCollectionBackdropPath(collectionName);

      try {
        const fileData = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileData);

        const result = data.map((item: any) => ({
          name: item.name,
          hex: item.hex,
          rarity: item.rarityPermille,
        }));

        res.json(result);
        return;
      } catch (e: any) {
        console.warn(
          `⚠️ Не удалось загрузить бекдропы для ${collectionName}: ${e.message}`,
        );
        res
          .status(404)
          .json({ error: `Backdrops not found for ${collectionName}` });
        return;
      }
    }

    if (cachedBackdrops) {
      res.json(cachedBackdrops);
      return;
    }

    const fileData = await fs.readFile(defaultFilePath, 'utf-8');
    const data = JSON.parse(fileData);

    cachedBackdrops = data;
    res.json(data);
  } catch (err: any) {
    console.error('❌ Ошибка при загрузке backdrops:', err.message);
    res.status(500).json({ error: 'Failed to load backdrops' });
  }
};
