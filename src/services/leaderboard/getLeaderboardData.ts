import { MoreThan } from 'typeorm';
import { AppDataSource } from '../../database/db';
import { LeaderboardEntry } from '../../models/leaderboard/Leaderboard';
import { User } from '../../models/User';
import { LeaderboardType } from '../../models/leaderboard/LeaderboardType';

interface LeaderboardEntryDto {
  rank: number;
  range: string;
  volume: string;
  user: {
    first_name: string | null;
    photo_url: string | null;
  };
}

interface LeaderboardResult {
  top: LeaderboardEntryDto[];
  my: LeaderboardEntryDto | null;
}

export async function getLeaderboardData(
  type: LeaderboardType,
  userId: string | undefined,
): Promise<LeaderboardResult> {
  const entryRepository = AppDataSource.getRepository(LeaderboardEntry);
  const userRepository = AppDataSource.getRepository(User);

  const topEntries = await entryRepository.find({
    where: { type, rank: MoreThan(0) },
    relations: ['user'],
    order: { rank: 'ASC' },
    take: 100,
  });

  const top: LeaderboardEntryDto[] = topEntries
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

  if (!userId) {
    return { top, my: null };
  }

  const myEntry = await entryRepository.findOne({
    where: { type, user_id: userId },
    relations: ['user'],
  });

  if (myEntry && myEntry.user) {
    return {
      top,
      my: {
        rank: myEntry.rank,
        range: myEntry.range,
        volume: myEntry.volume,
        user: {
          first_name: myEntry.user.first_name,
          photo_url: myEntry.user.photo_url,
        },
      },
    };
  }

  const user = await userRepository.findOne({
    where: { id: userId },
    select: ['first_name', 'photo_url'],
  });

  return {
    top,
    my: {
      rank: 0,
      range: '-',
      volume: '0',
      user: {
        first_name: user?.first_name ?? null,
        photo_url: user?.photo_url ?? null,
      },
    },
  };
}
