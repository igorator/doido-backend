import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { botSendMessage } from '../../services/messages/botSendMessage';
import { GiftStatus } from '../../models/Gift';
import Decimal from 'decimal.js';
import {
  GIFT_LISTING_PERCENT_FEE,
  MAX_FREE_GIFTS_LISTINGS,
} from '../../shared/constants';

export const listGiftForSaleById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { gift_id } = req.params;
  const { price, price_with_fee } = req.body;
  const telegramUser = (req as any).telegramUser;

  const GIFT_LISTING_FEE = new Decimal(GIFT_LISTING_PERCENT_FEE);
  const MAX_FREE_LISTINGS = MAX_FREE_GIFTS_LISTINGS;

  if (!price || isNaN(price) || !price_with_fee || isNaN(price_with_fee)) {
    res.status(400).json({ error: 'Invalid price or price_with_fee' });
    return;
  }

  if (!gift_id) {
    res.status(404).json({ error: 'Gift_id not found' });
    return;
  }

  try {
    const gift = await giftRepository.findOne({
      where: { id: gift_id },
      relations: ['owner'],
    });

    if (!gift) {
      res.status(404).json({ error: 'Gift not found' });
      return;
    }

    if (!gift.owner || gift.owner.id !== String(telegramUser.id)) {
      console.warn('❌ User tried to list a gift that does not belong to them');
      res.status(403).json({ error: 'Forbidden: not your gift' });
      return;
    }

    const owner = gift.owner;
    let feeApplied = false;

    if (gift.free_listings_used >= MAX_FREE_LISTINGS) {
      if (owner.ton_balance.lessThan(GIFT_LISTING_FEE)) {
        res.status(402).json({ error: 'Insufficient balance for listing fee' });
        return;
      }

      owner.ton_balance = owner.ton_balance.minus(GIFT_LISTING_FEE);
      await userRepository.save(owner);
      feeApplied = true;
    }

    gift.free_listings_used += 1;
    gift.status = GiftStatus.LISTED;
    gift.sell_price = new Decimal(price);
    gift.sell_price_with_fee = new Decimal(price_with_fee);
    gift.listed_date = new Date();

    const updatedGift = await giftRepository.save(gift);

    res.json({
      id: updatedGift.id,
      collection_name: updatedGift.collection_name,
      number: updatedGift.number,
      status: updatedGift.status,
      sell_price: updatedGift.sell_price,
      sell_price_with_fee: updatedGift.sell_price_with_fee,
      listed_date: updatedGift.listed_date,
      free_listings_used: updatedGift.free_listings_used,
      owner: {
        id: owner.id,
        username: owner.username,
      },
    });

    await botSendMessage(
      owner.id,
      `🛒 You listed <b>${updatedGift.collection_name} #${
        updatedGift.number
      }</b> 💰 for <code>${updatedGift.sell_price.toFixed(3)} TON</code>`,
      'HTML',
    );
    console.log(
      `[${new Date().toISOString()}] 📤 ${owner.username} (${
        owner.id
      }) выставил ${updatedGift.collection_name} #${
        updatedGift.number
      } за ${updatedGift.sell_price_with_fee.toFixed(3)} TON` +
        (feeApplied
          ? ` | 💸 Списано ${GIFT_LISTING_FEE.toFixed(2)} TON за листинг`
          : ' | 🎁 Бесплатный листинг'),
    );
  } catch (error) {
    console.error('❌ Ошибка при листинге подарка:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
