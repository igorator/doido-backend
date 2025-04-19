import { Router } from 'express';
import {
  getGifts,
  getGiftById,
  getUserGifts,
} from '../controllers/giftController/giftController';

const router = Router();

router.get('/gifts', getGifts);
router.get('/gifts/:id', getGiftById);
router.get('/user/:userId', getUserGifts);

export default router;
