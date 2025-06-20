import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

let cachedPatterns: any[] | null = null;

const defaultFilePath = path.resolve(
  process.cwd(),
  'assets/gifts/patterns.json',
);

const getCollectionPatternPath = (collectionName: string) =>
  path.resolve(
    process.cwd(),
    'assets/gifts/patterns',
    collectionName,
    'sorted.json',
  );

export const getGiftsPatterns = async (req: Request, res: Response) => {
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
      const filePath = getCollectionPatternPath(collectionName);

      try {
        const fileData = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileData);

        const result = data.map((item: any) => ({
          name: item.name,
          rarity: item.rarityPermille,
        }));

        res.json(result);
        return;
      } catch (e: any) {
        console.warn(
          `⚠️ Не удалось загрузить паттерны для ${collectionName}: ${e.message}`,
        );
        res
          .status(404)
          .json({ error: `Patterns not found for ${collectionName}` });
        return;
      }
    }

    if (cachedPatterns) {
      res.json(cachedPatterns);
      return;
    }

    const fileData = await fs.readFile(defaultFilePath, 'utf-8');
    const raw: Record<string, any> = JSON.parse(fileData);

    cachedPatterns = Object.entries(raw).map(([id, data]) => ({
      id,
      name: data.name,
    }));

    res.json(cachedPatterns);
  } catch (err: any) {
    console.error('❌ Ошибка при загрузке patterns:', err.message);
    res.status(500).json({ error: 'Failed to load patterns' });
  }
};
