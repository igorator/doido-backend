import { Router } from 'express';
import { addTelegramUser } from '../controllers/userController/addTelegramUser';

const router = Router();

router.post('/', addTelegramUser);

export default router;
