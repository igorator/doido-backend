import { Router } from 'express';
import { addUser } from '../controllers/userController/addUser';

const router = Router();

router.post('/', addUser);

export default router;
