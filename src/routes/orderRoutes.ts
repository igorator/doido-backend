import { Router } from 'express';
import { verifyTelegramAuth } from '../middleware';
import { getUserGiftsOrders } from '../controllers/orders/gifts/getUserOrders';
import { createGiftOrder } from '../controllers/orders/gifts/createGiftOrder';
import { deleteGiftOrder } from '../controllers/orders/gifts/deleteGiftOrder';

const router = Router();

router.get('/gifts', verifyTelegramAuth, getUserGiftsOrders);
router.post('/gifts/create', verifyTelegramAuth, createGiftOrder);
router.delete('/gifts/:orderId', verifyTelegramAuth, deleteGiftOrder);

export default router;
