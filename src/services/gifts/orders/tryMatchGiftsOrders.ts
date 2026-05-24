import { MoreThanOrEqual } from 'typeorm';
import { Gift, GiftStatus } from '../../../models/Gift';
import { GiftOrder, GiftOrderStatus } from '../../../models/orders/GiftOrder';
import { AppDataSource } from '../../../database/db';
import { buyGiftsService } from '../buyGiftsByIds';

const giftOrderRepository = AppDataSource.getRepository(GiftOrder);

/**
 * Attempts to fill pending limit orders for a newly listed gift.
 * Called after a gift is listed for sale — runs outside the listing transaction.
 * On a successful match, delegates to buyGiftsService for balance transfer,
 * activity logging and WebSocket notifications.
 */
export const tryMatchOrders = async (gift: Gift): Promise<void> => {
  if (gift.status !== GiftStatus.LISTED) {
    console.warn(
      `⚠ tryMatchOrders: gift ${gift.id} is not LISTED (status=${gift.status}), skipping`,
    );
    return;
  }

  const candidates = await giftOrderRepository.find({
    where: {
      status: GiftOrderStatus.ACTIVE,
      maxPrice: MoreThanOrEqual(gift.sell_price_with_fee.toString()),
      collectionName: gift.collection_name ?? null,
      modelName: gift.model?.name ?? null,
      backdropName: gift.backdrop?.name ?? null,
      patternName: gift.pattern?.name ?? null,
    },
    order: { createdAt: 'ASC' },
  });

  if (!candidates.length) {
    console.log(`ℹ [Order Match] No matching orders for gift ${gift.id}`);
    return;
  }

  for (const order of candidates) {
    if (order.filledQuantity >= order.quantity) continue;

    try {
      await AppDataSource.transaction(async (manager) => {
        // Re-fetch with pessimistic lock to prevent concurrent fills
        const lockedOrder = await manager
          .getRepository(GiftOrder)
          .createQueryBuilder('o')
          .setLock('pessimistic_write')
          .where('o.id = :id', { id: order.id })
          .getOne();

        if (
          !lockedOrder ||
          lockedOrder.status !== GiftOrderStatus.ACTIVE ||
          lockedOrder.filledQuantity >= lockedOrder.quantity
        ) {
          return; // Already fulfilled by a concurrent request
        }

        // Execute the purchase — balance transfer, activity log, WS updates
        await buyGiftsService(manager, Number(lockedOrder.userId), [gift.id]);

        lockedOrder.filledQuantity += 1;
        if (lockedOrder.filledQuantity >= lockedOrder.quantity) {
          lockedOrder.status = GiftOrderStatus.COMPLETED;
        }

        await manager.save(lockedOrder);
      });

      console.log(`🎯 [Order Match] Order ${order.id} filled by gift ${gift.id}`);
      break; // Gift sold — stop looking
    } catch (err) {
      console.warn(
        `⚠ [Order Match] Could not fill order ${order.id} for gift ${gift.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      // Try next order
    }
  }
};
