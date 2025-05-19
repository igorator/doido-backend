import { Router } from 'express';
import { getActivity } from '../controllers/activity/getActivity';
import { getUserActivity } from '../controllers/activity/getUserActivity';
import { getGiftsActivity } from '../controllers/activity/gifts/getGiftsActivity';

const router = Router();

router.get('/', getActivity);
router.get('/gifts', getGiftsActivity);
router.get('/:user_id', getUserActivity);

export default router;
