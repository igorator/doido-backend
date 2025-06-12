import { Bot } from 'grammy';

import { onGiftRouter } from './gifts/onGift';
import { onStart } from './onStart';

export const setupBotHandlers = (bot: Bot) => {
  console.log('👐 Bot handlers setteled');

  onStart(bot);
  onGiftRouter(bot);
};
