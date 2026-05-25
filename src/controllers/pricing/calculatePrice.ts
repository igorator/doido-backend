import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { calculatePriceService } from '../../services/pricing/calculatePriceService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const calculatePrice = (req: Request, res: Response): void => {
  const { seller_price, buyer_price } = req.query;

  if (!seller_price && !buyer_price) {
    res.status(400).json({ error: 'Provide either seller_price or buyer_price' });
    return;
  }

  if (seller_price && buyer_price) {
    res.status(400).json({ error: 'Provide only one of seller_price or buyer_price' });
    return;
  }

  try {
    const raw = String(seller_price ?? buyer_price);
    const amount = new Decimal(raw);
    const direction = seller_price ? 'fromSeller' : 'fromBuyer';

    const { sellerPrice, buyerPays } = calculatePriceService(amount, direction);

    res.json({
      seller_price: sellerPrice.toNumber(),
      buyer_pays: buyerPays.toNumber(),
    });
  } catch (err) {
    handleHttpError(res, err, 'calculatePrice');
  }
};
