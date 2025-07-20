import { MARKET_PERCENT_FEE } from './../../shared/constants';
import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { botSendMessage } from '../../services/messages/botSendMessage';
import { GiftStatus } from '../../models/Gift';
import Decimal from 'decimal.js';

export const editGiftPriceById = async (
  req: Request<{ gift_id: string }, any, { price: string }>,
  res: Response,
): Promise<void> => {
  const { gift_id } = req.params;
  const { price } = req.body;
  const telegramUser = (req as any).telegramUser;

  const MARKET_FEE = new Decimal(MARKET_PERCENT_FEE);

  if (!price || isNaN(Number(price))) {
    console.warn('🚫 Invalid input:', { price });
    res.status(400).json({ error: 'Invalid price' });
    return;
  }

  if (!gift_id) {
    res.status(404).json({ error: 'Gift_id not found' });
    return;
  }

  const basePrice = new Decimal(price);
  if (basePrice.lte(0)) {
    res.status(400).json({ error: 'Price must be positive' });
    return;
  }

  const priceWithFee = basePrice
    .mul(MARKET_FEE.add(1))
    .toDecimalPlaces(3, Decimal.ROUND_HALF_UP);

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
      res.status(403).json({ error: 'Forbidden: not your gift' });
      return;
    }

    if (gift.status !== GiftStatus.LISTED) {
      res.status(400).json({ error: 'Gift is not listed for sale' });
      return;
    }

    const now = Date.now();
    const lastUpdated = new Date(gift.updated_at ?? gift.created_at).getTime();
    const secondsSinceUpdate = (now - lastUpdated) / 1000;

    if (secondsSinceUpdate < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceUpdate);
      res.status(429).json({
        error: `Wait ${waitSeconds} seconds before editing price again`,
      });
      return;
    }

    gift.sell_price = basePrice;
    gift.sell_price_with_fee = priceWithFee;

    const updatedGift = await giftRepository.save(gift);

    res.json({
      id: updatedGift.id,
      collection_name: updatedGift.collection_name,
      number: updatedGift.number,
      status: updatedGift.status,
      sell_price: updatedGift.sell_price,
      sell_price_with_fee: updatedGift.sell_price_with_fee,
    });

    await botSendMessage(
      gift.owner.id,
      `✏️ You updated price of <b>${updatedGift.collection_name} #${
        updatedGift.number
      }</b> 💰 to <code>${updatedGift.sell_price.toFixed(3)} TON</code>`,
      'HTML',
    );

    console.log(
      `[${new Date().toISOString()}] ✏️ ${gift.owner.username} (${
        gift.owner.id
      }) изменил цену ${updatedGift.collection_name} #${
        updatedGift.number
      } на ${updatedGift.sell_price_with_fee.toFixed(3)} TON`,
    );
  } catch (error) {
    console.error('❌ Ошибка при редактировании цены подарка:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
