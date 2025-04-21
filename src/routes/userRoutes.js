import { Router } from 'express';
import { addUser } from '../controllers/userController/addUser';
import { verifyTelegramHash } from '../middlewares/middleware';

const router = Router();

router.post('/', verifyTelegramHash, addUser);

export default router;
