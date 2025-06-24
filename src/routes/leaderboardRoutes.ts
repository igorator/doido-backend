import { Router } from 'express';

import { getWeeklyLeaderboard } from '../controllers/leaderboard/getWeeklyLeaderboard';
import { getAlltimeLeaderboard } from '../controllers/leaderboard/getAlltimeLeaderboard';

const router = Router();

router.get('/weekly', getWeeklyLeaderboard);
router.get('/all-time', getAlltimeLeaderboard);

export default router;
