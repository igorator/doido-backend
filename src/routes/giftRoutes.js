import { Router } from 'express';
import {
  addGift,
  getGifts,
  getGiftById,
  deleteGiftById,
  getUserGifts,
} from '../controllers/giftController/giftController';

const router = Router();

router.post('/', addGift);
router.get('/', getGifts);
router.get('/:id', getGiftById);
router.delete('/:id', deleteGiftById);
router.get('/user/:userId', getUserGifts);

export default router;
