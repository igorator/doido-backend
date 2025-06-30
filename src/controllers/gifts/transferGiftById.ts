import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { minusUserBalance } from '../../services/user/updateUserBalance';
import Decimal from 'decimal.js';
import { transferGift } from '../../services/gifts/transferGift';
import { sendBalanceUpdate } from '../../sockets/sendBalanceUpdate';
import { GIFT_TRANSFER_FEE } from '../../shared/constants';
import { incrementMarketProfit } from '../../services/market/incrementMarketProfit';

export const transferGiftById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { gift_id } = req.params;
  const telegramUser = (req as any).telegramUser;
  const transferFee = new Decimal(GIFT_TRANSFER_FEE);

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
    if (!owner) {
      res.status(400).json({ error: 'Owner not found' });
      return;
    }

    if (owner.ton_balance.lt(transferFee)) {
      res.status(402).json({ error: 'Insufficient TON balance' });
      return;
    }

    await minusUserBalance(owner.id, transferFee);
    sendBalanceUpdate(owner.id);

    await incrementMarketProfit('gift_transfer', transferFee); // 👈 учёт в прибыли

    await transferGift({
      giftId: gift.id,
      newOwnerId: telegramUser.id,
    });

    await giftRepository.delete(gift.id);

    const timestamp = new Date().toISOString();
    console.log(
      `🛒🎁 [${timestamp}] ПЕРЕДАЧА ПОДАРКА: ${owner.username || owner.id} (${
        owner.id
      }) передал ${gift.collection_name} #${gift.number} → ${
        telegramUser.username || telegramUser.id
      } (${telegramUser.id}) | Списано: ${transferFee.toFixed(3)} TON`,
    );

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error during gift transfer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
