import { Router } from 'express';
import { authTelegramUser } from '../controllers/authController/authTelegramUser';

const router = Router();

router.post('/', authTelegramUser);

export default router;
