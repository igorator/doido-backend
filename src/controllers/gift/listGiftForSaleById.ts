import { Request, Response } from 'express';
import { giftRepository } from '../../database/repositories/giftRepository';
import { botSendMessage } from '../../services/messages/botSendMessage';

export const listGiftForSaleById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { gift_id } = req.params;
  const { price, price_with_fee } = req.body;
  const telegramUser = (req as any).telegramUser;

  if (!price || isNaN(price)) {
    res.status(400).json({ error: 'Invalid price' });
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

    gift.is_listed = true;
    gift.sell_price = Number(price);
    gift.sell_price_with_fee = Number(price_with_fee);
    gift.listed_date = new Date();

    const updatedGift = await giftRepository.save(gift);

    if (updatedGift.owner) {
      delete updatedGift.owner.gifts;
    }

    res.json({
      id: updatedGift.id,
      collection_name: updatedGift.collection_name,
      number: updatedGift.number,
      is_listed: updatedGift.is_listed,
      sell_price: updatedGift.sell_price,
      sell_price_with_fee: updatedGift.sell_price_with_fee,
      listed_date: updatedGift.listed_date,
      owner: updatedGift.owner
        ? {
            id: updatedGift.owner.id,
            username: updatedGift.owner.username,
          }
        : null,
    });

    await botSendMessage(
      updatedGift.owner.id,
      `🛒 You listed <b>${updatedGift.collection_name} #${updatedGift.number}</b> 💰 for <code>${updatedGift.sell_price} TON</code>`,
      'HTML',
    );
  } catch (error) {
    console.error('❌ Ошибка при выставлении подарка на продажу:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
