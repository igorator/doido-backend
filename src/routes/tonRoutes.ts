import { Router } from 'express';

import { withdrawTon } from '../controllers/ton/withdrawTon';
import { getTonBalance } from '../controllers/ton/getTonBalance';
import { verifyTelegramAuth } from '../middleware';
import { depositTon } from '../controllers/ton/depositTon';
import { getDepositWithdrawLimits } from '../controllers/ton/getDepositWithdrawLimits';

const router = Router();

router.post('/deposit', verifyTelegramAuth, depositTon);
router.post('/withdraw', verifyTelegramAuth, withdrawTon);
router.get('/wallet-balance/:address', getTonBalance);
router.get('/deposit-withdraw-limits', getDepositWithdrawLimits);

export default router;
