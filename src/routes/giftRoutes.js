import { Router } from 'express';
import { getGifts } from '../controllers/giftController/getGifts';
import { listGiftForSaleById } from '../controllers/giftController/listGiftForSaleById';
import { unlistGiftFromSaleById } from '../controllers/giftController/unlistGiftFromSaleById';
import { getGiftsByUserId } from '../controllers/giftController/getUserGiftsById';
import { verifyTelegramAuth, verifyGiftOwnerMatch } from '../middleware';

const router = Router();

router.get('/', getGifts);

router.get('/user', verifyTelegramAuth, getGiftsByUserId);

router.patch(
  '/:gift_id/list',
  verifyTelegramAuth,
  verifyGiftOwnerMatch,
  listGiftForSaleById,
);

router.patch(
  '/:gift_id/unlist',
  verifyTelegramAuth,
  verifyGiftOwnerMatch,
  unlistGiftFromSaleById,
);

export default router;
