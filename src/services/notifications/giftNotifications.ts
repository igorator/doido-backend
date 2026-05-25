import Decimal from 'decimal.js';
import { botSendMessage } from '../messages/botSendMessage';
import type { Gift } from '../../models/Gift';
import type { User } from '../../models/User';
import type { Activity } from '../../models/Activity';

export function notifyGiftListed(gift: Gift, owner: User, feeApplied: boolean): void {
  botSendMessage(
    owner.id,
    `🛒 You listed <b>${gift.collection_name} #${gift.number}</b>` +
      ` 💰 for <code>${gift.sell_price.toFixed(3)} TON</code>`,
    'HTML',
  ).catch(() => {});

  console.log(
    `[${new Date().toISOString()}] 📤 ${owner.username} (${owner.id})` +
      ` listed ${gift.collection_name} #${gift.number}` +
      ` for ${gift.sell_price_with_fee.toFixed(3)} TON` +
      (feeApplied ? ` | listing fee charged` : ' | free listing'),
  );
}

export function notifyGiftPriceEdited(gift: Gift): void {
  botSendMessage(
    gift.owner.id,
    `✏️ You updated price of <b>${gift.collection_name} #${gift.number}</b>` +
      ` 💰 to <code>${gift.sell_price.toFixed(3)} TON</code>`,
    'HTML',
  ).catch(() => {});

  console.log(
    `[${new Date().toISOString()}] ✏️ ${gift.owner.username} (${gift.owner.id})` +
      ` updated price of ${gift.collection_name} #${gift.number}` +
      ` to ${gift.sell_price_with_fee.toFixed(3)} TON`,
  );
}

export function notifyGiftTransferred(gift: Gift, newOwnerId: string): void {
  console.log(
    `[${new Date().toISOString()}] 🎁 TRANSFER: ${gift.owner.username} (${gift.owner.id})` +
      ` → (${newOwnerId}) | ${gift.collection_name} #${gift.number}`,
  );
}

export function notifyGiftSold(activities: Activity[]): void {
  for (const activity of activities) {
    botSendMessage(
      activity.seller.id,
      `🎉 Your gift <b>${activity.gift_collection_name} #${activity.gift_number}</b>` +
        ` was sold for <code>${activity.amount} TON</code>`,
      'HTML',
    ).catch(() => {});
  }
}

export function notifyGiftPurchased(
  buyer: User,
  seller: User,
  gift: Gift,
  sellPriceWithFee: Decimal,
  refLog: string,
): void {
  console.log(
    `[${new Date().toISOString()}] 🛒 PURCHASE: ${buyer.username} (${buyer.id})` +
      ` bought ${gift.collection_name} #${gift.number}` +
      ` from ${seller.username} (${seller.id})` +
      ` for \x1b[38;2;0;152;234m${sellPriceWithFee.toFixed(3)} TON\x1b[0m | ${refLog}`,
  );
}

export function notifyGiftPostTransfer(gift: Gift, newOwnerId: string | number): void {
  console.log(
    `[${new Date().toISOString()}] 📦 Gift ${gift.collection_name} #${gift.number}` +
      ` transferred & removed (id ${gift.id}) → user ${newOwnerId}`,
  );
}
