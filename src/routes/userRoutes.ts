import { Router } from 'express';

import { verifyTelegramAuth } from '../middleware';
import { authTelegramUser } from '../controllers/user/authTelegramUser';
import { updateUserReferral } from '../controllers/user/updateUserRefferal';

const router = Router();
router.post('/auth', verifyTelegramAuth, authTelegramUser);
router.patch('/:id/referral', verifyTelegramAuth, updateUserReferral);

export default router;
