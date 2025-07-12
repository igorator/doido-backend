import { Request, Response } from 'express';
import { AppDataSource } from '../../../database/db';
import { GiftOrder, GiftOrderStatus } from '../../../models/orders/GiftOrder';

export const deleteGiftOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const telegramUser = (req as any).telegramUser;

  if (!telegramUser?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!id) {
    res.status(400).json({ error: 'Order ID is required' });
    return;
  }

  try {
    const repo = AppDataSource.getRepository(GiftOrder);
    const order = await repo.findOneBy({ id });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.userId !== String(telegramUser.id)) {
      res.status(403).json({ error: 'Forbidden: not your order' });
      return;
    }

    if (order.status !== GiftOrderStatus.ACTIVE) {
      res.status(400).json({ error: 'Only active orders can be deleted' });
      return;
    }

    await repo.remove(order);

    res.status(200).json({ success: true, id: order.id });
    return;
  } catch (error) {
    console.error('❌ Ошибка при удалении заказа:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
};
