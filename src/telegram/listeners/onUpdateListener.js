import { client } from '../tdClient';
import { handleUpdate } from '../handlers/handleUpdate';

export const setupTelegramListeners = () => {
  client.on('update', handleUpdate);
};
