import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

let cachedBackdrops: any[] | null = null;

const filePath = path.resolve(process.cwd(), 'assets/gifts/backdrops.json');

export const getGiftsBackdrops = async (_req: Request, res: Response) => {
  if (cachedBackdrops) {
    res.json(cachedBackdrops);
    return;
  }

  try {
    const fileData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileData);

    cachedBackdrops = data;
    res.json(cachedBackdrops);
    return;
  } catch (err: any) {
    console.error('❌ Ошибка при загрузке backdrops:', err.message);
    res.status(500).json({ error: 'Failed to load backdrops' });
    return;
  }
};
