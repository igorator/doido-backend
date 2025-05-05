import { Request, Response } from 'express';
import { bot } from '../../bot/bot';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { transferStarsCount } from '../../shared/constants';
import { deleteGiftFromDatabaseById } from '../../bot/services/gifts/deleteGiftFromDatabaseById';

export const transferGiftById = async (req: Request, res: Response) => {
  const { gift_id } = req.params;
  const telegramUser = (req as any).telegramUser;

  try {
    const gift = await giftRepository.findOne({
      where: { id: gift_id },
      relations: ['owner'],
    });

    if (!gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    if (gift.owner.id !== String(telegramUser.id)) {
      return res
        .status(403)
        .json({ error: 'You are not the owner of this gift' });
    }

    const owner = await userRepository.findOneBy({ id: gift.owner.id });
    if (!owner || !owner.id) {
      return res.status(400).json({ error: 'Chat ID for owner not found' });
    }

    const businessId = process.env.TELEGRAM_BUSINESS_CONNECTION_ID;
    if (!businessId) {
      return res.status(400).json({ error: 'Business connection ID not set' });
    }

    await bot.api.transferGift(
      businessId,
      gift.id,
      Number(owner.id),
      transferStarsCount,
    );

    await deleteGiftFromDatabaseById(gift.id);
    console.log(`🗑 Подарок ${gift.id} удалён после трансфера`);

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Error during transferGift:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
