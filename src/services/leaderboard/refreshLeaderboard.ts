import { AppDataSource } from '../../database/db';
import { LeaderboardEntry } from '../../models/leaderboard/Leaderboard';
import { LeaderboardType } from '../../models/leaderboard/LeaderboardType';
import { User } from '../../models/User';
import { MoreThan } from 'typeorm';

const TOP_SIZE = 100;

function getRangeLabel(rank: number): '1-100' | '101-200' | '201-500' | '500+' | '-' {
  if (rank <= 0) return '-';
  if (rank <= 100) return '1-100';
  if (rank <= 200) return '101-200';
  if (rank <= 500) return '201-500';
  return '500+';
}

export async function refreshLeaderboard() {
  const userRepository = AppDataSource.getRepository(User);
  const leaderboardRepository = AppDataSource.getRepository(LeaderboardEntry);

  console.log(`[${new Date().toISOString()}] 🔄 Refreshing leaderboard...`);

  const [weeklyTop, alltimeTop] = await Promise.all([
    userRepository.find({
      where: { is_admin: false, weekly_market_amount: MoreThan(0) },
      order: { weekly_market_amount: 'DESC' },
      take: TOP_SIZE,
    }),
    userRepository.find({
      where: { is_admin: false, total_market_amount: MoreThan(0) },
      order: { total_market_amount: 'DESC' },
      take: TOP_SIZE,
    }),
  ]);

  const weeklyEntries: Partial<LeaderboardEntry>[] = weeklyTop.map((user, index) => ({
    user_id: user.id,
    type: LeaderboardType.WEEKLY,
    rank: index + 1,
    range: getRangeLabel(index + 1),
    volume: user.weekly_market_amount.toString(),
  }));

  const alltimeEntries: Partial<LeaderboardEntry>[] = alltimeTop.map((user, index) => ({
    user_id: user.id,
    type: LeaderboardType.ALLTIME,
    rank: index + 1,
    range: getRangeLabel(index + 1),
    volume: user.total_market_amount.toString(),
  }));

  await leaderboardRepository.manager.transaction(async (trx) => {
    await trx.delete(LeaderboardEntry, {});
    await trx.insert(LeaderboardEntry, [...weeklyEntries, ...alltimeEntries]);
  });

  console.log(
    `[${new Date().toISOString()}] ✅ Leaderboard refreshed:` +
      ` weekly=${weeklyEntries.length}, alltime=${alltimeEntries.length}`,
  );
}
