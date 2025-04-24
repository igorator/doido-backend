import { Router } from 'express';
import { getSellerReceivesByBuyerPrice } from '../controllers/pricingContoller/getSellerReceivesByBuyerPrice';
import { getBuyerPaysBySellerPrice } from '../controllers/pricingContoller/getBuyerPaysBySellerPrice';
import { getSellPriceLimits } from '../controllers/pricingContoller/getSellPriceLimits';

const router = Router();

router.get('/buyer-pays', getBuyerPaysBySellerPrice);
router.get('/seller-receives', getSellerReceivesByBuyerPrice);
router.get('/limits', getSellPriceLimits);

export default router;
