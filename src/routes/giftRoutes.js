import { Router } from 'express';
import {
  getGifts,
  getGiftById,
  getUserGifts,
} from '../controllers/giftController/giftController';

const router = Router();

router.get('/', getGifts);
router.get('/:id', getGiftById);
router.get('/:userId', getUserGifts);

export default router;
