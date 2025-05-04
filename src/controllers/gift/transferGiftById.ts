import { Request, Response } from 'express';
import { bot } from '../../bot/bot';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { businessConnectionService } from '../../bot/services/telegram/businessConnectionService';

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

    const owner = await userRepository.findOneBy({
      id: gift.owner.id,
    });

    if (!owner || !owner.chat_id) {
      return res.status(400).json({ error: 'Chat ID for owner not found' });
    }

    const businessId = businessConnectionService.get(owner.id);
    if (!businessId) {
      return res.status(400).json({ error: 'Business connection not found' });
    }

    await bot.api.transferGift(businessId, gift.id, Number(owner.chat_id), 0);

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Error during transferGift:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
