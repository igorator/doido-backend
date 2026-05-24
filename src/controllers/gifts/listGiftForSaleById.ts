import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { botSendMessage } from '../../services/messages/botSendMessage';
import { GiftStatus } from '../../models/Gift';
import Decimal from 'decimal.js';
import {
  GIFT_LISTING_PERCENT_FEE,
  MARKET_PERCENT_FEE,
  MAX_FREE_GIFTS_LISTINGS,
  MIN_SELL_PRICE,
  MAX_SELL_PRICE,
} from '../../shared/constants';
import { incrementMarketProfit } from '../../services/market/incrementMarketProfit';

export const listGiftForSaleById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { gift_id } = req.params;
  const { price } = req.body;
  const telegramUser = (req as any).telegramUser;

  const MARKET_FEE = new Decimal(MARKET_PERCENT_FEE);
  const GIFT_LISTING_FEE = new Decimal(GIFT_LISTING_PERCENT_FEE);

  if (!price || isNaN(Number(price))) {
    res.status(400).json({ error: 'Invalid price' });
    return;
  }

  const basePrice = new Decimal(price);
  if (basePrice.lt(MIN_SELL_PRICE)) {
    res
      .status(400)
      .json({ error: `Price must be at least ${MIN_SELL_PRICE} TON` });
    return;
  }
  if (basePrice.gt(MAX_SELL_PRICE)) {
    res
      .status(400)
      .json({ error: `Price must not exceed ${MAX_SELL_PRICE} TON` });
    return;
  }

  const priceWithFee = basePrice
    .mul(MARKET_FEE.add(1))
    .toDecimalPlaces(3, Decimal.ROUND_HALF_UP);

  if (!gift_id) {
    res.status(404).json({ error: 'Gift_id not found' });
    return;
  }

  try {
    await AppDataSource.transaction(async (manager) => {
      const gift = await manager.findOne(giftRepository.target, {
        where: { id: gift_id },
        relations: ['owner'],
      });

      if (!gift) {
        res.status(404).json({ error: 'Gift not found' });
        return;
      }

      if (!gift.owner || gift.owner.id !== String(telegramUser.id)) {
        console.warn(
          '❌ User tried to list a gift that does not belong to them',
        );
        res.status(403).json({ error: 'Forbidden: not your gift' });
        return;
      }

      const owner = await manager
        .getRepository(userRepository.target)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :id', { id: gift.owner.id })
        .getOneOrFail();

      let feeApplied = false;

      if (gift.free_listings_used >= MAX_FREE_GIFTS_LISTINGS) {
        if (owner.ton_balance.lessThan(GIFT_LISTING_FEE)) {
          res
            .status(402)
            .json({ error: 'Insufficient balance for listing fee' });
          return;
        }

        owner.ton_balance = owner.ton_balance.minus(GIFT_LISTING_FEE);
        await manager.save(owner);
        await incrementMarketProfit('gift_listing', GIFT_LISTING_FEE);

        feeApplied = true;
      }

      gift.free_listings_used += 1;
      gift.status = GiftStatus.LISTED;
      gift.sell_price = basePrice;
      gift.sell_price_with_fee = priceWithFee;
      gift.listed_date = new Date();

      const updatedGift = await manager.save(gift);

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
    });
  } catch (error) {
    console.error('❌ Ошибка при листинге подарка:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

};
