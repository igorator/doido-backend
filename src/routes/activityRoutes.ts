import { Router } from 'express';

import { getUserGiftsActivity } from '../controllers/activity/gifts/getUserGiftsActivity';
import { getGiftsActivity } from '../controllers/activity/gifts/getGiftsActivity';
import { verifyTelegramAuth } from '../middleware';

const router = Router();

router.get('/gifts', getGiftsActivity);
router.get('/gifts/:user_id', verifyTelegramAuth, getUserGiftsActivity);

export default router;
