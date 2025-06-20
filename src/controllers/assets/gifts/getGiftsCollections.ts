import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { AppDataSource } from '../../../database/db';
import { Gift, GiftStatus } from '../../../models/Gift';

const filePath = path.resolve(process.cwd(), 'assets/gifts/id-to-name.json');

// Кеш в памяти
let cache: { data: any[]; updatedAt: number } | null = null;
const CACHE_TTL_MS = 30000;

export const getGiftsCollections = async (_req: Request, res: Response) => {
  if (cache && Date.now() - cache.updatedAt < CACHE_TTL_MS) {
    res.json(cache.data);
    return;
  }

  try {
    // Читаем коллекции из файла
    const fileData = await fs.readFile(filePath, 'utf-8');
    const raw: Record<string, string> = JSON.parse(fileData);

    // Получаем статистику из базы
    const giftsRepo = AppDataSource.getRepository(Gift);
    const stats = await giftsRepo
      .createQueryBuilder('gift')
      .select('gift.collection_name', 'collectionName')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MIN(gift.sell_price)', 'floorPrice')
      .where('gift.status = :status', { status: GiftStatus.LISTED })
      .groupBy('gift.collection_name')
      .getRawMany();

    // Готовим мапу для быстрого доступа
    const statsMap = new Map<string, { count: number; floorPrice?: number }>();
    stats.forEach((s) => {
      statsMap.set(s.collectionName, {
        count: Number(s.count),
        floorPrice: s.floorPrice !== null ? Number(s.floorPrice) : undefined,
      });
    });

    // Формируем финальный ответ
    const result = Object.entries(raw)
      .map(([id, name]) => {
        const base = {
          id,
          name,
          image: `/assets/gifts/originals/${encodeURIComponent(
            id,
          )}/Original.png`,
        };

        const stat = statsMap.get(name);
        if (stat && stat.count > 0) {
          return {
            ...base,
            itemCount: stat.count,
            floorPrice:
              stat.floorPrice !== undefined
                ? Number(stat.floorPrice.toFixed(2))
                : undefined,
          };
        }

        return base;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    cache = { data: result, updatedAt: Date.now() };
    res.json(result);
  } catch (err: any) {
    console.error('❌ Ошибка при загрузке collections:', err.message);
    res.status(500).json({ error: 'Failed to load collections' });
  }
};
