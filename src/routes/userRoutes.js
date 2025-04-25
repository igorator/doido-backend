import { Router } from 'express';
import { addTelegramUser } from '../controllers/userController/addTelegramUser';
import { updateUserReferral } from '../controllers/userController/updateUserRefferal';

const router = Router();

router.post('/', addTelegramUser);
router.patch('/:id/referral', updateUserReferral);

export default router;
