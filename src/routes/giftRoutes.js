import { Router } from 'express';
import {
  getGifts,
  getGiftById,
  getUserGifts,
  listGiftForSaleById,
  unlistGiftFromSaleById,
} from '../controllers/giftController';

const router = Router();

router.get('/', getGifts);
router.get('/gift/:id', getGiftById);
router.get('/user/:userId', getUserGifts);

router.patch('/:id/list', listGiftForSaleById);
router.patch('/:id/unlist', unlistGiftFromSaleById);

export default router;
