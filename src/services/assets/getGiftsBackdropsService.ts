import fs from 'fs/promises';
import path from 'path';
import { createHttpError } from '../../shared/lib/httpError';

export interface BackdropEntry {
  name: string;
  hex: string;
  rarity: number;
}

interface BackdropFileEntry {
  name: string;
  hex: string;
  rarityPermille: number;
}

let cachedBackdrops: BackdropEntry[] | null = null;

const defaultFilePath = path.resolve(process.cwd(), 'assets/gifts/backdrops.json');

const getCollectionBackdropPath = (collectionName: string) =>
  path.resolve(process.cwd(), 'assets/gifts/backdrops', collectionName, 'backdrops.json');

export async function getGiftsBackdropsService(collections: string[]): Promise<BackdropEntry[]> {
  if (collections.length === 1) {
    try {
      const fileData = await fs.readFile(getCollectionBackdropPath(collections[0]), 'utf-8');
      const data: BackdropFileEntry[] = JSON.parse(fileData);
      return data.map((item) => ({ name: item.name, hex: item.hex, rarity: item.rarityPermille }));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw createHttpError(`Backdrops not found for collection: ${collections[0]}`, 404);
      }
      throw err;
    }
  }

  if (cachedBackdrops) {
    return cachedBackdrops;
  }

  const fileData = await fs.readFile(defaultFilePath, 'utf-8');
  cachedBackdrops = JSON.parse(fileData) as BackdropEntry[];
  return cachedBackdrops;
}
