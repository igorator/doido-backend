import { Router } from 'express';
import {
  getGifts,
  getGiftById,
  getUserGifts,
} from '../controllers/giftController/giftController';

const router = Router();

router.get('/', getGifts);
router.get('/gift/:id', getGiftById);
router.get('/user/:userId', getUserGifts);

export default router;
