import { client } from '../tdClient';

export const transferGift = async (recipientId, gift) => {
  return await client.invoke({
    _: 'transferGift',
    recipient_id: recipientId,
    gift: gift,
  });
};
