import { Request, Response } from 'express';
import { AppDataSource } from '../../database/db';
import { buyGiftsService, processPostBuyTransfers } from '../../services/gifts/buyGiftsService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const buyGiftsByIds = async (req: Request, res: Response): Promise<void> => {
  const telegramUser = req.telegramUser;
  const { gift_ids } = req.body;

  if (!telegramUser?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!Array.isArray(gift_ids) || gift_ids.length === 0) {
    res.status(400).json({ error: 'No gift IDs provided' });
    return;
  }

  const uniqueGiftIds: string[] = Array.from(new Set(gift_ids));

  try {
    const { boughtGifts, updatedBalance } = await AppDataSource.transaction((manager) =>
      buyGiftsService(manager, String(telegramUser.id), uniqueGiftIds),
    );

    const giftsRequiringTransfer = boughtGifts.filter((gift) => gift.requires_transfer);

    res.status(200).json({
      success: true,
      bought: boughtGifts.map((gift) => gift.id),
      updated_balance: updatedBalance,
      external: giftsRequiringTransfer.length > 0,
    });

    if (giftsRequiringTransfer.length > 0) {
      processPostBuyTransfers(giftsRequiringTransfer, telegramUser.id).catch((err) =>
        console.error('❌ Post-buy transfers failed:', err),
      );
    }
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] 🛑 PURCHASE FAILED:` +
        ` ${telegramUser?.username} (${telegramUser?.id})`,
    );
    handleHttpError(res, err, 'buyGiftsByIds');
  }
};
