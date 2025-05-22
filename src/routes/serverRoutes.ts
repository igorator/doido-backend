import { Router } from 'express';
import { checkServerStatus } from '../controllers/server/checkServerStatus';
import { checkIsMaintenance } from '../controllers/server/checkIsMaintenance';

const router = Router();

router.get('/status', checkServerStatus);
router.get('/maintenance', checkIsMaintenance);

export default router;
