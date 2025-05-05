import { Router } from 'express';
import { getActivity } from '../controllers/activity/getActivity';
import { getUserActivity } from '../controllers/activity/getUserActivity';

const router = Router();

router.get('/', getActivity);
router.get('/user_id', getUserActivity);

export default router;
