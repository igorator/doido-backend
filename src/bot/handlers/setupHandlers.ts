import { Bot } from 'grammy';

import { onGiftRouter } from './gifts/onGift';

export const setupBotHandlers = (bot: Bot) => {
  console.log('👐 Bot handlers setteled');

  onGiftRouter(bot);
};
