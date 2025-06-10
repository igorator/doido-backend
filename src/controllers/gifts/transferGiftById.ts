import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { transferGift } from '../../services/gifts/transferGift';
import { GiftStatus } from '../../models/Gift';
import { minusUserBalance } from '../../services/user/updateUserBalance'; // предполагаемая функция
import Decimal from 'decimal.js';

export const transferGiftById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { gift_id } = req.params;
  const telegramUser = (req as any).telegramUser;
  const transferFee = new Decimal(process.env.GIFT_TRANSFER_FEE);

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

    if (owner.ton_balance.lt(transferFee)) {
      res.status(402).json({ error: 'Insufficient TON balance' });
      return;
    }

    await minusUserBalance(owner.id, transferFee);

    await transferGift({
      giftId: gift.id,
      newOwnerId: owner.id,
    });

    gift.status = GiftStatus.TRANSFERRED;
    gift.transferred_date = new Date();
    gift.listed_date = null;
    gift.owner.id = `227261761`;
    gift.sell_price = new Decimal(0);
    gift.sell_price_with_fee = new Decimal(0);
    gift.free_listings_used = 0;
    gift.status = GiftStatus.TRANSFERRED;
    await giftRepository.save(gift);

    console.log(
      `✅ Подарок ${gift.id} помечен как TRANSFERRED, списано 0.1 TON`,
    );

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error during transferGift:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
