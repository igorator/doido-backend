import { Request, Response } from 'express';
import { getLeaderboardData } from '../../services/leaderboard/getLeaderboardData';
import { LeaderboardType } from '../../models/leaderboard/LeaderboardType';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const getAlltimeLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.user_id as string | undefined;
    const data = await getLeaderboardData(LeaderboardType.ALLTIME, userId);
    res.json(data);
  } catch (err) {
    handleHttpError(res, err, 'getAlltimeLeaderboard');
  }
};
