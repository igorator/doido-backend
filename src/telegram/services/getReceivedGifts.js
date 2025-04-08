import { client } from '../tdClient';

export const getReceivedGifts = async () => {
  return await client.invoke({
    _: 'getReceivedGifts',
  });
};
