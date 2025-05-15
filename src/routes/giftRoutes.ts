import { Router } from 'express';
import { getGifts } from '../controllers/gift/getGifts';
import { listGiftForSaleById } from '../controllers/gift/listGiftForSaleById';
import { unlistGiftFromSaleById } from '../controllers/gift/unlistGiftFromSaleById';
import { getGiftsByUserId } from '../controllers/gift/getUserGiftsById';
import { verifyTelegramAuth, verifyGiftOwnerMatch } from '../middleware';
import { buyGiftsByIds } from '../controllers/gift/buyGiftsById';
import { transferGiftById } from '../controllers/gift/transferGiftById';
import { checkIsGiftInStock } from '../controllers/gift/checkIsGiftInStock';

const router = Router();

router.get('/', getGifts);

router.get('/user', verifyTelegramAuth, getGiftsByUserId);

router.post('/buy', verifyTelegramAuth, buyGiftsByIds);

router.get('/is-in-stock', verifyTelegramAuth, checkIsGiftInStock);

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

router.get(
  '/:gift_id/transfer',
  verifyTelegramAuth,
  verifyGiftOwnerMatch,
  transferGiftById,
);

export default router;
