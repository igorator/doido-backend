import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { LeaderboardEntry } from '../../models/leaderboard/Leaderboard';

export const getWeeklyLeaderboard = async (req: Request, res: Response) => {
  const { user_id } = req.query;

  const repo = AppDataSource.getRepository(LeaderboardEntry);

  const topEntries = await repo
    .createQueryBuilder('entry')
    .leftJoinAndSelect('entry.user', 'user')
    .where('entry.type = :type AND entry.rank > 0', { type: 'weekly' })
    .orderBy('entry.rank', 'ASC')
    .take(100)
    .getMany();

  const top = topEntries.map((entry) => ({
    rank: entry.rank,
    range: entry.range,
    volume: entry.volume,
    user: {
      id: entry.user?.id || null,
      first_name: entry.user?.first_name || null,
      photo_url: entry.user?.photo_url || null,
    },
  }));

  let my = null;

  if (user_id && typeof user_id === 'string') {
    const myEntry = await repo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.user', 'user')
      .where('entry.type = :type AND entry.user_id = :user_id', {
        type: 'weekly',
        user_id,
      })
      .getOne();

    if (myEntry) {
      my = {
        rank: myEntry.rank,
        range: myEntry.range,
        volume: myEntry.volume,
        user: {
          id: myEntry.user?.id || user_id,
          first_name: myEntry.user?.first_name || null,
          photo_url: myEntry.user?.photo_url || null,
        },
      };
    } else {
      my = {
        rank: 0,
        range: '-',
        volume: '0',
        user: {
          id: user_id,
          first_name: null,
          photo_url: null,
        },
      };
    }
  }

  res.json({ top, my });
};
