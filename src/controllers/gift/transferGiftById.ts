import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { transferStarsCount } from '../../shared/constants';
import { deleteGiftFromDatabaseById } from '../../services/gifts/deleteGiftFromDatabaseById';
import { transferGift } from '../../services/gifts/transferGift';

export const transferGiftById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { gift_id } = req.params;
  const telegramUser = (req as any).telegramUser;

  try {
    const gift = await giftRepository.findOne({
      where: { id: gift_id },
      relations: ['owner'],
    });

    if (!gift) {
      res.status(404).json({ error: 'Gift not found' });
      return;
    }

    if (gift.owner.id !== String(telegramUser.id)) {
      res.status(403).json({ error: 'You are not the owner of this gift' });
      return;
    }

    const owner = await userRepository.findOneBy({ id: gift.owner.id });
    if (!owner || !owner.id) {
      res.status(400).json({ error: 'Chat ID for owner not found' });
      return;
    }

    const businessId = process.env.TELEGRAM_BUSINESS_CONNECTION_ID;
    if (!businessId) {
      res.status(400).json({ error: 'Business connection ID not set' });
      return;
    }

    await transferGift({
      business_connection_id: businessId,
      owned_gift_id: gift.id,
      new_owner_chat_id: owner.id,
      star_count: transferStarsCount,
    });

    await deleteGiftFromDatabaseById(gift.id);
    console.log(`🗑 Подарок ${gift.id} удалён после трансфера`);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error during transferGift:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
