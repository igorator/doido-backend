import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { transferGift } from '../../services/gifts/transferGift';
import { sendBalanceUpdate } from '../../sockets/sendBalanceUpdate';
import { GIFT_TRANSFER_FEE } from '../../shared/constants';
import { incrementMarketProfit } from '../../services/market/incrementMarketProfit';
import Decimal from 'decimal.js';

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

    await AppDataSource.transaction(async (manager) => {
      const owner = await manager
        .getRepository(userRepository.target)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :id', { id: gift.owner.id })
        .getOne();

      if (!owner) {
        throw new Error('Owner not found');
      }

      if (owner.ton_balance.lt(transferFee)) {
        throw new Error('Insufficient TON balance');
      }

      owner.ton_balance = owner.ton_balance.minus(transferFee);
      await manager.save(owner);

      // 💰 Увеличиваем профит маркета
      await incrementMarketProfit('gift_transfer', transferFee);

      // 🔁 Выполняем передачу
      await transferGift({
        giftId: gift.id,
        newOwnerId: telegramUser.id,
      });

      // 🗑 Удаляем подарок (если надо)
      await manager.getRepository(giftRepository.target).delete(gift.id);

      // 🔄 Обновление баланса на клиенте
      sendBalanceUpdate(owner.id);

      const timestamp = new Date().toISOString();
      console.log(
        `🛒🎁 [${timestamp}] ПЕРЕДАЧА ПОДАРКА: ${owner.username || owner.id} (${
          owner.id
        }) передал ${gift.collection_name} #${gift.number} → ${
          telegramUser.username || telegramUser.id
        } (${telegramUser.id}) | Списано: ${transferFee.toFixed(3)} TON`,
      );
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('❌ Error during gift transfer:', err);
    const message =
      err?.message === 'Insufficient TON balance'
        ? err.message
        : 'Internal server error';
    const status = err?.message === 'Insufficient TON balance' ? 402 : 500;
    res.status(status).json({ error: message });
  }
};
