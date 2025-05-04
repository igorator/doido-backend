import { Router } from 'express';
import { addTelegramUser } from '../controllers/user/addTelegramUser';
import { updateUserReferral } from '../controllers/user/updateUserRefferal';

const router = Router();

router.post('/', addTelegramUser);
router.patch('/:id/referral', updateUserReferral);

export default router;
