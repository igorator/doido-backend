import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { transferGift } from '../../services/gifts/transferGift';
import { GiftStatus } from '../../models/Gift';

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

    await transferGift({
      giftId: gift.id,
      newOwnerId: owner.id,
    });

    gift.status = GiftStatus.TRANSFERRED;
    await giftRepository.save(gift);

    console.log(`✅ Подарок ${gift.id} помечен как TRANSFERRED`);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error during transferGift:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
