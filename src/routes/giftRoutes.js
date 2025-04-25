import { Router } from 'express';
import { getGifts } from '../controllers/giftController/getGifts';
import { listGiftForSaleById } from '../controllers/giftController/listGiftForSaleById';
import { unlistGiftFromSaleById } from '../controllers/giftController/unlistGiftFromSaleById';

const router = Router();

router.get('/', getGifts);
router.patch('/:id/list', listGiftForSaleById);
router.patch('/:id/unlist', unlistGiftFromSaleById);

export default router;
