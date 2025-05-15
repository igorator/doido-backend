import { Router } from 'express';
import { updateUserReferral } from '../controllers/user/updateUserRefferal';
import { verifyTelegramAuth } from '../middleware';
import { authTelegramUser } from '../controllers/user/authTelegramUser';

const router = Router();

router.get('/auth', verifyTelegramAuth, authTelegramUser);
router.patch('/:id/referral', updateUserReferral);

export default router;
