import { Router } from 'express';
import { checkServerStatus } from '../controllers/server/checkServerStatus';

const router = Router();

router.get('/status', checkServerStatus);

export default router;
