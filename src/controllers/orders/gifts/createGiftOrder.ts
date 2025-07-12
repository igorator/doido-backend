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
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const invalidArrayFields = [
    collectionName,
    modelName,
    backdropName,
    patternName,
  ].some((v) => Array.isArray(v));

  if (invalidArrayFields) {
    res.status(400).json({
      error: 'Each category field must contain only one item (not array)',
    });
    return;
  }

  const isFilterProvided =
    collectionName || modelName || backdropName || patternName || maxPrice;

  if (!isFilterProvided) {
    res.status(400).json({
      error:
        'At least one filter must be provided (collection, model, backdrop, pattern, or maxPrice)',
    });
    return;
  }

  if (!maxPrice || isNaN(Number(maxPrice)) || !quantity || quantity <= 0) {
    res.status(400).json({ error: 'Invalid maxPrice or quantity' });
    return;
  }

  const maxPriceDecimal = new Decimal(maxPrice);
  const balanceLocked = maxPriceDecimal.mul(quantity);

  try {
    const result = await AppDataSource.transaction(async (manager) => {
      await manager
        .getRepository(GiftOrder)
        .createQueryBuilder('order')
        .setLock('pessimistic_write')
        .where('order.userId = :userId', { userId: String(telegramUser.id) })
        .andWhere('order.status = :status', { status: GiftOrderStatus.ACTIVE })
        .getMany();

      // 🔍 Проверка на дубликат
      const existing = await manager.findOne(GiftOrder, {
        where: {
          userId: String(telegramUser.id),
          collectionName: collectionName || null,
          modelName: modelName || null,
          backdropName: backdropName || null,
          patternName: patternName || null,
          maxPrice: maxPriceDecimal.toFixed(8),
          quantity,
          status: GiftOrderStatus.ACTIVE,
        },
      });

      if (existing) {
        return { conflict: true, existing };
      }

      const order = manager.create(GiftOrder, {
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

      const saved = await manager.save(order);
      return { conflict: false, saved };
    });

    if (result.conflict) {
      res.status(409).json({
        error: 'You already have an active identical order.',
        orderId: result.existing.id,
      });
      return;
    }

    const saved = result.saved;

    res.status(201).json({
      id: saved.id,
      userId: saved.userId,
      quantity: saved.quantity,
      balanceLocked: saved.balanceLocked,
      status: saved.status,
      createdAt: saved.createdAt,
    });
    return;
  } catch (error) {
    console.error('❌ Ошибка при создании заказа:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
};
