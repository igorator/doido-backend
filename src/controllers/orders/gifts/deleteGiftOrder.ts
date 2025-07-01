import { Request, Response } from 'express';
import { AppDataSource } from '../../../database/db';
import { GiftOrder, GiftOrderStatus } from '../../../models/orders/GiftOrder';

export const deleteGiftOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const telegramUser = (req as any).telegramUser;

  if (!telegramUser?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    const repo = AppDataSource.getRepository(GiftOrder);
    const order = await repo.findOneBy({ id });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== String(telegramUser.id)) {
      return res.status(403).json({ error: 'Forbidden: not your order' });
    }

    if (order.status !== GiftOrderStatus.ACTIVE) {
      return res
        .status(400)
        .json({ error: 'Only active orders can be deleted' });
    }

    await repo.remove(order);

    return res.status(200).json({ success: true, id: order.id });
  } catch (error) {
    console.error('❌ Ошибка при удалении заказа:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
