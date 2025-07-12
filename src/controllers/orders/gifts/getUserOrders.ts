import { Request, Response } from 'express';
import { AppDataSource } from '../../../database/db';
import { GiftOrder } from '../../../models/orders/GiftOrder';

export const getUserGiftsOrders = async (req: Request, res: Response) => {
  try {
    const telegramUser = (req as any).telegramUser;

    if (!telegramUser?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const giftOrderRepo = AppDataSource.getRepository(GiftOrder);
    const orders = await giftOrderRepo.find({
      where: { userId: String(telegramUser.id) },
      order: { createdAt: 'DESC' },
    });

    res.json({ orders });
  } catch (error) {
    console.error('❌ Error in getUserOrders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
