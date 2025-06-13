import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { botSendMessage } from '../../services/messages/botSendMessage';
import { GiftStatus } from '../../models/Gift';
import Decimal from 'decimal.js';

export const editGiftPriceById = async (
  req: Request<
    { gift_id: string },
    any,
    { price: string; price_with_fee: string }
  >,
  res: Response,
): Promise<void> => {
  const { gift_id } = req.params;
  const { price, price_with_fee } = req.body;
  const telegramUser = (req as any).telegramUser;

  if (
    !price ||
    isNaN(Number(price)) ||
    !price_with_fee ||
    isNaN(Number(price_with_fee))
  ) {
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
      console.warn('❌ User tried to edit a gift that does not belong to them');
      res.status(403).json({ error: 'Forbidden: not your gift' });
      return;
    }

    if (gift.status !== GiftStatus.LISTED) {
      res.status(400).json({ error: 'Gift is not listed for sale' });
      return;
    }

    gift.sell_price = new Decimal(price);
    gift.sell_price_with_fee = new Decimal(price_with_fee);

    const updatedGift = await giftRepository.save(gift);

    res.json({
      id: updatedGift.id,
      collection_name: updatedGift.collection_name,
      number: updatedGift.number,
      status: updatedGift.status,
      sell_price: updatedGift.sell_price,
      sell_price_with_fee: updatedGift.sell_price_with_fee,
      listed_date: updatedGift.listed_date,
    });

    await botSendMessage(
      gift.owner.id,
      `✏️ You updated price of <b>${updatedGift.collection_name} #${updatedGift.number}</b> 💰 to <code>${price} TON</code>`,
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
