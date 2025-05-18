import { Router } from 'express';

import { verifyTelegramAuth } from '../middleware';
import { authTelegramUser } from '../controllers/user/authTelegramUser';
import { updateUserReferralController } from '../controllers/user/updateUserRefferal';

const router = Router();
router.get('/auth', verifyTelegramAuth, authTelegramUser);
router.patch('/:id/referral', verifyTelegramAuth, updateUserReferralController);

export default router;
