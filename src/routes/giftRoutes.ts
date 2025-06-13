import { Router } from 'express';
import { getGifts } from '../controllers/gifts/getGifts';
import { listGiftForSaleById } from '../controllers/gifts/listGiftForSaleById';
import { unlistGiftFromSaleById } from '../controllers/gifts/unlistGiftFromSaleById';
import { getGiftsByUserId } from '../controllers/gifts/getUserGiftsById';
import { verifyTelegramAuth, verifyGiftOwnerMatch } from '../middleware';
import { transferGiftById } from '../controllers/gifts/transferGiftById';
import { checkGiftsIsInStock } from '../controllers/gifts/checkIsGiftsInStock';
import { buyGiftsByIds } from '../controllers/gifts/buyGiftsById';
import { editGiftPriceById } from '../controllers/gifts/editGiftPriceById';

const router = Router();

router.get('/', getGifts);

router.get('/user', verifyTelegramAuth, getGiftsByUserId);

router.post('/buy', verifyTelegramAuth, buyGiftsByIds);

router.patch(
  '/:gift_id/list',
  verifyTelegramAuth,
  verifyGiftOwnerMatch,
  listGiftForSaleById,
);

router.patch(
  ':gift_id/edit-price',
  verifyTelegramAuth,
  verifyGiftOwnerMatch,
  editGiftPriceById,
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

router.post('/is-in-stock', checkGiftsIsInStock);

export default router;
