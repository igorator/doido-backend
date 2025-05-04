import { Bot } from 'grammy';
import { setBusinessConnectionId } from '../../shared/businessConnectionId';

export const onBusinessConnection = (bot: Bot) => {
  bot.on('business_connection:is_enabled', async (ctx) => {
    const conn = ctx.businessConnection;
    if (!conn?.id) return;

    setBusinessConnectionId(conn.id);
  });
};
