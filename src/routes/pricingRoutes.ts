import { Router } from 'express';
import { calculatePrice } from '../controllers/pricing/calculatePrice';
import { getSellPriceLimits } from '../controllers/pricing/getSellPriceLimits';
import { getFees } from '../controllers/pricing/getFees';

const router = Router();

router.get('/calculate', calculatePrice);
router.get('/limits', getSellPriceLimits);
router.get('/fees', getFees);

export default router;
