import { In } from 'typeorm';
import { giftRepository } from '../../database/repositories/giftRepository';
import { Gift, GiftStatus } from '../../models/Gift';

export interface GiftStockRequest {
  id: string;
  sell_price_with_fee: number;
}

export interface GiftStockResult {
  available: boolean;
  gifts: Gift[];
  unavailable: string[];
  priceMismatch: { id: string; actual_price: number }[];
}

export async function checkGiftsStockService(
  requests: GiftStockRequest[],
): Promise<GiftStockResult> {
  const ids = requests.map((request) => request.id);

  const dbGifts = await giftRepository.find({
    where: { id: In(ids) },
    relations: ['owner'],
  });

  const unavailable: string[] = [];
  const priceMismatch: { id: string; actual_price: number }[] = [];

  for (const { id, sell_price_with_fee } of requests) {
    const dbGift = dbGifts.find((giftRecord) => giftRecord.id === id);

    if (!dbGift || dbGift.status !== GiftStatus.LISTED) {
      unavailable.push(id);
    } else if (!dbGift.sell_price_with_fee.eq(sell_price_with_fee)) {
      priceMismatch.push({ id, actual_price: dbGift.sell_price_with_fee.toNumber() });
    }
  }

  return {
    available: unavailable.length === 0 && priceMismatch.length === 0,
    gifts: dbGifts,
    unavailable,
    priceMismatch,
  };
}
