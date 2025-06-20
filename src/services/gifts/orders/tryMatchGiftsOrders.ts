import { MoreThanOrEqual } from 'typeorm';
import { Gift, GiftStatus } from '../../../models/Gift';
import { GiftOrder } from '../../../models/orders/GiftOrder';
import { AppDataSource } from '../../../database/db';
import Decimal from 'decimal.js';

const giftRepository = AppDataSource.getRepository(Gift);
const giftOrderRepository = AppDataSource.getRepository(GiftOrder);

export const tryMatchOrders = async (gift: Gift): Promise<void> => {
  if (gift.status !== GiftStatus.LISTED) {
    console.warn(
      `⚠ Попытка матчить подарок ${gift.id}, который не в статусе LISTED`,
    );
    return;
  }

  const orders = await giftOrderRepository.find({
    where: [
      {
        status: 'active',
        maxPrice: MoreThanOrEqual(gift.sell_price_with_fee.toString()),
        collectionName: gift.collection_name ?? null,
        modelName: gift.model?.name ?? null,
        backdropName: gift.backdrop?.name ?? null,
        patternName: gift.pattern?.name ?? null,
      },
    ],
    order: { createdAt: 'ASC' },
  });

  if (orders.length === 0) {
    console.log(`ℹ Нет подходящих ордеров для подарка ${gift.id}`);
    return;
  }

  for (const order of orders) {
    if (order.filledQuantity >= order.quantity) {
      console.warn(`⚠ Ордер ${order.id} уже выполнен`);
      continue;
    }

    const price = new Decimal(gift.sell_price_with_fee);
    const balanceLocked = new Decimal(order.balanceLocked);

    if (balanceLocked.lessThan(price)) {
      console.warn(
        `⚠ Недостаточно заблокированного баланса по ордеру ${order.id}`,
      );
      continue;
    }

    order.filledQuantity += 1;
    order.balanceLocked = balanceLocked.minus(price).toString();

    if (order.filledQuantity >= order.quantity) {
      order.status = 'completed';
    }

    gift.status = GiftStatus.SOLD;

    await AppDataSource.transaction(async (manager) => {
      await manager.save(order);
      await manager.save(gift);
    });

    console.log(`🎯 Ордер ${order.id} выполнен подарком ${gift.id}`);

    break;
  }
};
