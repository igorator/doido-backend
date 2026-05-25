import Decimal from 'decimal.js';
import { AppDataSource } from '../../database/db';
import { giftRepository } from '../../database/repositories/giftRepository';
import { userRepository } from '../../database/repositories/userRepository';
import { Gift } from '../../models/Gift';
import { incrementMarketProfit } from '../market/incrementMarketProfit';
import { notifyGiftTransferred } from '../notifications/giftNotifications';
import { transferGift } from './transferGift';
import { sendBalanceUpdate } from '../../sockets/sendBalanceUpdate';
import { createHttpError } from '../../shared/lib/httpError';
import { config } from '../../config';

const TRANSFER_FEE = new Decimal(config.fees.giftTransfer);

export async function transferGiftService(gift: Gift, newOwnerId: string): Promise<void> {
  const ownerId = await AppDataSource.transaction(async (manager) => {
    const owner = await manager
      .getRepository(userRepository.target)
      .createQueryBuilder('user')
      .setLock('pessimistic_write')
      .where('user.id = :id', { id: gift.owner.id })
      .getOneOrFail();

    if (owner.ton_balance.lt(TRANSFER_FEE)) {
      throw createHttpError('Insufficient TON balance', 402);
    }

    owner.ton_balance = owner.ton_balance.minus(TRANSFER_FEE);
    await manager.save(owner);
    await manager.getRepository(giftRepository.target).delete(gift.id);

    return owner.id;
  });

  sendBalanceUpdate(ownerId);
  notifyGiftTransferred(gift, newOwnerId);

  incrementMarketProfit('gift_transfer', TRANSFER_FEE).catch((err) =>
    console.error('❌ Failed to record transfer fee profit:', err),
  );

  transferGift({ giftId: gift.id, newOwnerId }).catch((err) =>
    console.error(`❌ On-chain transfer failed for gift ${gift.id}:`, err),
  );
}
