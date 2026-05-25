import { Request, Response } from 'express';
import { transferGiftService } from '../../services/gifts/transferGiftService';
import { handleHttpError } from '../../shared/lib/handleHttpError';

export const transferGiftById = async (req: Request, res: Response): Promise<void> => {
  const gift = req.verifiedGift!;
  const telegramUser = req.telegramUser!;

  try {
    await transferGiftService(gift, String(telegramUser.id));
    res.json({ success: true });
  } catch (err) {
    handleHttpError(res, err, 'transferGiftById');
  }
};
