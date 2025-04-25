import { Router } from 'express';
import { authTelegramUser } from '../controllers/authController/authTelegramUser';

const router = Router();

router.get('/', authTelegramUser);

export default router;
