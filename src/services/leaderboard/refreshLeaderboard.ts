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
    .where('(user.weekly_market_amount > 0 OR user.total_market_amount > 0)')
    .andWhere('user.is_admin = false')
    .orderBy('user.total_market_amount', 'DESC')
    .addOrderBy('user.weekly_market_amount', 'DESC')
    .getMany();

  const weeklyEntries: Partial<LeaderboardEntry>[] = [];
  const alltimeEntries: Partial<LeaderboardEntry>[] = [];

  let weeklyRank = 0;
  let alltimeRank = 0;

  users.forEach((user) => {
    if (user.weekly_market_amount.gt(0)) {
      weeklyRank++;
      weeklyEntries.push({
        user_id: user.id,
        type: LeaderboardType.WEEKLY,
        rank: weeklyRank <= 100 ? weeklyRank : 0,
        range: getRangeLabel(weeklyRank),
        volume: user.weekly_market_amount.toString(),
      });
    }

    if (user.total_market_amount.gt(0)) {
      alltimeRank++;
      alltimeEntries.push({
        user_id: user.id,
        type: LeaderboardType.ALLTIME,
        rank: alltimeRank <= 100 ? alltimeRank : 0,
        range: getRangeLabel(alltimeRank),
        volume: user.total_market_amount.toString(),
      });
    }
  });

  await leaderboardRepo.manager.transaction(async (trx) => {
    await trx.delete(LeaderboardEntry, {});
    await trx.insert(LeaderboardEntry, [...weeklyEntries, ...alltimeEntries]);
  });

  console.log(
    `✅ Лидерборд обновлён: weekly=${weeklyEntries.length}, alltime=${alltimeEntries.length}`,
  );
}

function getRangeLabel(rank: number): '1-100' | '101-200' | '201-500' | '500+' {
  if (rank <= 100) return '1-100';
  if (rank <= 200) return '101-200';
  if (rank <= 500) return '201-500';
  return '500+';
}
