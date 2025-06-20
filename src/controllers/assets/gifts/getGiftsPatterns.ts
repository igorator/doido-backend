import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

let cachedPatterns: any[] | null = null;

const filePath = path.resolve(process.cwd(), 'assets/gifts/patterns.json');

export const getGiftsPatterns = async (_req: Request, res: Response) => {
  if (cachedPatterns) {
    res.json(cachedPatterns);
    return;
  }

  try {
    const fileData = await fs.readFile(filePath, 'utf-8');
    const raw: Record<string, string> = JSON.parse(fileData);

    cachedPatterns = Object.entries(raw).map(([id, data]: [string, any]) => ({
      id,
      name: data.name,
      png: data.png,
      tgs: data.tgs,
    }));

    res.json(cachedPatterns);
    return;
  } catch (err: any) {
    console.error('❌ Ошибка при загрузке patterns:', err.message);
    res.status(500).json({ error: 'Failed to load patterns' });
    return;
  }
};
