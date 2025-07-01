import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { LeaderboardEntry } from '../../models/leaderboard/Leaderboard';
import { User } from '../../models/User';

export const getWeeklyLeaderboard = async (req: Request, res: Response) => {
  const userId = req.query.user_id as string | undefined;

  const repo = AppDataSource.getRepository(LeaderboardEntry);
  const userRepo = AppDataSource.getRepository(User);

  const topEntries = await repo
    .createQueryBuilder('entry')
    .leftJoinAndSelect('entry.user', 'user')
    .where('entry.type = :type AND entry.rank > 0', { type: 'weekly' })
    .orderBy('entry.rank', 'ASC')
    .take(100)
    .getMany();

  const top = topEntries
    .filter((entry) => entry.user)
    .map((entry) => ({
      rank: entry.rank,
      range: entry.range,
      volume: entry.volume,
      user: {
        first_name: entry.user.first_name,
        photo_url: entry.user.photo_url,
      },
    }));

  let my = null;

  if (userId) {
    const myEntry = await repo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.user', 'user')
      .where('entry.type = :type AND entry.user_id = :userId', {
        type: 'weekly',
        userId,
      })
      .getOne();

    if (myEntry && myEntry.user) {
      my = {
        rank: myEntry.rank,
        range: myEntry.range,
        volume: myEntry.volume,
        user: {
          first_name: myEntry.user.first_name,
          photo_url: myEntry.user.photo_url,
        },
      };
    } else {
      const user = await userRepo.findOne({
        where: { id: userId },
        select: ['first_name', 'photo_url'],
      });

      my = {
        rank: 0,
        range: '-',
        volume: '0',
        user: {
          first_name: user?.first_name || null,
          photo_url: user?.photo_url || null,
        },
      };
    }
  }

  res.json({ top, my });
};
