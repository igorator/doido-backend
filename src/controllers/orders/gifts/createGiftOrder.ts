import { Request, Response } from 'express';
import Decimal from 'decimal.js';
import { AppDataSource } from '../../../database/db';
import { GiftOrder, GiftOrderStatus } from '../../../models/orders/GiftOrder';

export const createGiftOrder = async (req: Request, res: Response) => {
  const {
    collectionName,
    modelName,
    backdropName,
    patternName,
    maxPrice,
    quantity,
  } = req.body;

  const telegramUser = (req as any).telegramUser;

  if (!telegramUser?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!maxPrice || isNaN(Number(maxPrice)) || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid maxPrice or quantity' });
  }

  const maxPriceDecimal = new Decimal(maxPrice);
  const balanceLocked = maxPriceDecimal.mul(quantity);

  try {
    const giftOrderRepo = AppDataSource.getRepository(GiftOrder);

    const order = giftOrderRepo.create({
      userId: String(telegramUser.id),
      collectionName: collectionName || null,
      modelName: modelName || null,
      backdropName: backdropName || null,
      patternName: patternName || null,
      maxPrice: maxPriceDecimal.toFixed(8),
      quantity,
      filledQuantity: 0,
      balanceLocked: balanceLocked.toFixed(8),
      status: GiftOrderStatus.ACTIVE,
    });

    const saved = await giftOrderRepo.save(order);

    return res.status(201).json({
      id: saved.id,
      userId: saved.userId,
      quantity: saved.quantity,
      balanceLocked: saved.balanceLocked,
      status: saved.status,
      createdAt: saved.createdAt,
    });
  } catch (error) {
    console.error('❌ Ошибка при создании заказа:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
