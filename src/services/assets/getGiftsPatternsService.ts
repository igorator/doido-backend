import fs from 'fs/promises';
import path from 'path';
import { createHttpError } from '../../shared/lib/httpError';

export interface PatternEntry {
  id?: string;
  name: string;
  rarity?: number;
}

interface PatternFileEntry {
  name: string;
  rarityPermille: number;
}

let cachedPatterns: PatternEntry[] | null = null;

const defaultFilePath = path.resolve(process.cwd(), 'assets/gifts/patterns.json');

const getCollectionPatternPath = (collectionName: string) =>
  path.resolve(process.cwd(), 'assets/gifts/patterns', collectionName, 'sorted.json');

export async function getGiftsPatternsService(collections: string[]): Promise<PatternEntry[]> {
  if (collections.length === 1) {
    try {
      const fileData = await fs.readFile(getCollectionPatternPath(collections[0]), 'utf-8');
      const data: PatternFileEntry[] = JSON.parse(fileData);
      return data.map((item) => ({ name: item.name, rarity: item.rarityPermille }));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw createHttpError(`Patterns not found for collection: ${collections[0]}`, 404);
      }
      throw err;
    }
  }

  if (cachedPatterns) {
    return cachedPatterns;
  }

  const fileData = await fs.readFile(defaultFilePath, 'utf-8');
  const raw: Record<string, { name: string }> = JSON.parse(fileData);

  cachedPatterns = Object.entries(raw).map(([id, data]) => ({ id, name: data.name }));
  return cachedPatterns;
}
