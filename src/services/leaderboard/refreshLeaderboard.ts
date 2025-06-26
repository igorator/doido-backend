import { AppDataSource } from '../../database/db';
import { LeaderboardEntry } from '../../models/leaderboard/Leaderboard';
import { LeaderboardType } from '../../models/leaderboard/LeaderboardType';
import { User } from '../../models/User';

export async function refreshLeaderboard() {
  const userRepo = AppDataSource.getRepository(User);
  const leaderboardRepo = AppDataSource.getRepository(LeaderboardEntry);

  console.log('🔄 Обновление лидерборда...');

  const users = await userRepo
    .createQueryBuilder('user')
    .where('user.is_admin = false')
    .orderBy('user.total_market_amount', 'DESC')
    .addOrderBy('user.weekly_market_amount', 'DESC')
    .getMany();

  const weeklyEntries: Partial<LeaderboardEntry>[] = [];
  const alltimeEntries: Partial<LeaderboardEntry>[] = [];

  let weeklyRank = 0;
  let alltimeRank = 0;

  const weeklyTop100 = users
    .slice()
    .sort((a, b) => b.weekly_market_amount.comparedTo(a.weekly_market_amount))
    .slice(0, 100);

  for (let i = 0; i < weeklyTop100.length; i++) {
    const user = weeklyTop100[i];
    if (user.weekly_market_amount.lte(0)) continue;

    weeklyRank++;

    weeklyEntries.push({
      user_id: user.id,
      type: LeaderboardType.WEEKLY,
      rank: weeklyRank,
      range: getRangeLabel(weeklyRank),
      volume: user.weekly_market_amount.toString(),
    });
  }

  const alltimeTop100 = users
    .slice()
    .sort((a, b) => b.total_market_amount.comparedTo(a.total_market_amount))
    .slice(0, 100);

  for (let i = 0; i < alltimeTop100.length; i++) {
    const user = alltimeTop100[i];
    if (user.total_market_amount.lte(0)) continue;

    alltimeRank++;

    alltimeEntries.push({
      user_id: user.id,
      type: LeaderboardType.ALLTIME,
      rank: alltimeRank,
      range: getRangeLabel(alltimeRank),
      volume: user.total_market_amount.toString(),
    });
  }

  await leaderboardRepo.manager.transaction(async (trx) => {
    await trx.delete(LeaderboardEntry, {});
    await trx.insert(LeaderboardEntry, [...weeklyEntries, ...alltimeEntries]);
  });

  console.log(
    `✅ Лидерборд обновлён: weekly=${weeklyEntries.length}, alltime=${alltimeEntries.length}`,
  );
}

function getRangeLabel(
  rank: number,
): '1-100' | '101-200' | '201-500' | '500+' | '-' {
  if (rank === 0) return '-';
  if (rank <= 100) return '1-100';
  if (rank <= 200) return '101-200';
  if (rank <= 500) return '201-500';
  return '500+';
}
