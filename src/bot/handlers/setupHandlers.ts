import { Bot } from 'grammy';
import { onBusinessConnection } from './telegramBusiness/onBusinessConnection';
import { onGiftRouter } from './gifts/onGift';

export const setupBotHandlers = (bot: Bot) => {
  console.log('👐 Bot handlers setteled');

  onBusinessConnection(bot);
  onGiftRouter(bot);
};
