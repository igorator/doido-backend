import { Router } from 'express';
import { getSellerReceivesByBuyerPrice } from '../controllers/pricing/getSellerReceivesByBuyerPrice';
import { getBuyerPaysBySellerPrice } from '../controllers/pricing/getBuyerPaysBySellerPrice';
import { getSellPriceLimits } from '../controllers/pricing/getSellPriceLimits';

const router = Router();

router.get('/buyer-pays', getBuyerPaysBySellerPrice);
router.get('/seller-receives', getSellerReceivesByBuyerPrice);
router.get('/limits', getSellPriceLimits);

export default router;
