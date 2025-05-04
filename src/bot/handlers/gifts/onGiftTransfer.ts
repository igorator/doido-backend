import { Bot, Context } from 'grammy';
import { deleteGiftFromDatabaseById } from '../../services/gifts/deleteGiftFromDatabaseById';

export const onGiftTransfer = (bot: Bot) => {
  bot.on('business_message', async (ctx: Context) => {
    const message = ctx.businessMessage;
    if (!message?.unique_gift || !message.unique_gift.owned_gift_id) return;

    const connection = await ctx.getBusinessConnection();
    const employee = connection.user;

    if (ctx.from?.id !== employee.id) return;

    const giftId = String(message.unique_gift.owned_gift_id);

    try {
      await deleteGiftFromDatabaseById(giftId);
      console.log(`🗑 Подарок ${giftId} удалён после трансфера пользователю.`);
    } catch (err) {
      console.error(`❌ Ошибка при удалении подарка ${giftId}:`, err);
    }
  });
};
