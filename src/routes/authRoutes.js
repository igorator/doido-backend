import { Router } from 'express';
import { authTelegramUser } from '../controllers/authController/authTelegramUser';
import { verifyTelegramHashMiddleware } from '../middleware';

const router = Router();

router.get('/', verifyTelegramHashMiddleware, authTelegramUser);

export default router;
