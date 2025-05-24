import { Router } from 'express';

import { withdrawTon } from '../controllers/ton/withdrawTon';
import { getTonBalance } from '../controllers/ton/getTonBalance';
import { verifyTelegramAuth } from '../middleware';
import { depositTon } from '../controllers/ton/depositTon';

const router = Router();

router.post('/deposit', verifyTelegramAuth, depositTon);
router.post('/withdraw', verifyTelegramAuth, withdrawTon);
router.get('/wallet-balance/:address', verifyTelegramAuth, getTonBalance);

export default router;
