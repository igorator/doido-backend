import { Router } from 'express';
import { authTelegramUser } from '../controllers/auth/authTelegramUser';
import { verifyTelegramAuth } from '../middleware';

const router = Router();

router.get('/', verifyTelegramAuth, authTelegramUser);

export default router;
