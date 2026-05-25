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
import { getGiftById } from '../controllers/gifts/getGiftById';
import { getGiftsCollections } from '../controllers/assets/gifts/getGiftsCollections';
import { getGiftsBackdrops } from '../controllers/assets/gifts/getGiftsBackdrops';
import { getGiftsPatterns } from '../controllers/assets/gifts/getGiftsPatterns';
import { getGiftsModelsByCollections } from '../controllers/assets/gifts/getGiftsModelsByCollections';
import { checkUserNotBanned } from '../middleware/checkUserNotBanned';

const router = Router();

router.get('/collections', getGiftsCollections);
router.get('/backdrops', getGiftsBackdrops);
router.get('/patterns', getGiftsPatterns);
router.get('/models', getGiftsModelsByCollections);

router.get('/', getGifts);
router.get('/user', verifyTelegramAuth, getGiftsByUserId);
router.post('/buy', verifyTelegramAuth, checkUserNotBanned, buyGiftsByIds);
router.get('/:gift_id', getGiftById);

router.patch('/:gift_id/list', verifyTelegramAuth, verifyGiftOwnerMatch, listGiftForSaleById);
router.patch('/:gift_id/edit-price', verifyTelegramAuth, verifyGiftOwnerMatch, editGiftPriceById);
router.patch('/:gift_id/unlist', verifyTelegramAuth, verifyGiftOwnerMatch, unlistGiftFromSaleById);
router.post(
  '/:gift_id/transfer',
  verifyTelegramAuth,
  checkUserNotBanned,
  verifyGiftOwnerMatch,
  transferGiftById,
);
router.post('/is-in-stock', checkGiftsIsInStock);

export default router;
