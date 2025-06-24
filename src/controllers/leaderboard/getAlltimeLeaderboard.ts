import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { LeaderboardEntry } from '../../models/leaderboard/Leaderboard';
import { LeaderboardTier } from '../../models/leaderboard/LeaderboardTier';
import { User } from '../../models/User';

export const getAlltimeLeaderboard = async (req: Request, res: Response) => {
  const { user_id } = req.query;

  const repo = AppDataSource.getRepository(LeaderboardEntry);
  const userRepo = AppDataSource.getRepository(User);
  const tierRepo = AppDataSource.getRepository(LeaderboardTier);

  // Топ-100
  const topEntries = await repo
    .createQueryBuilder('entry')
    .leftJoinAndSelect('entry.user', 'user')
    .where('entry.type = :type AND entry.rank > 0', { type: 'alltime' })
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
    // Сначала пробуем найти в leaderboard
    const myEntry = await repo
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.user', 'user')
      .where('entry.type = :type AND entry.user_id = :user_id', {
        type: 'alltime',
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
      // Если в leaderboard нет — тянем юзера и считаем тир
      const userData = await userRepo.findOne({
        where: { id: user_id },
      });

      if (userData) {
        const tier = await tierRepo
          .createQueryBuilder('tier')
          .where('tier.type = :type', { type: 'alltime' })
          .andWhere('tier.min_volume <= :volume', {
            volume: userData.total_market_amount.toString(),
          })
          .andWhere('(tier.max_volume > :volume OR tier.max_volume IS NULL)', {
            volume: userData.total_market_amount.toString(),
          })
          .orderBy('tier.min_volume', 'DESC')
          .getOne();

        my = {
          rank: 0,
          range: tier?.label || '-',
          volume: userData.total_market_amount.toString(),
          user: {
            id: userData.id,
            first_name: userData.first_name || null,
            photo_url: userData.photo_url || null,
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
  }

  res.json({ top, my });
};
