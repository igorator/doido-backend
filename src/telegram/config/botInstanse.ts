import { client } from '../tdClient';

let botUserId: number | null = null;

export async function initializeBotUserId() {
  try {
    const me = await client.invoke({ '@type': 'getMe' });

    if (!me || me._ !== 'user' || !me.id) {
      throw new Error('Invalid response from getMe');
    }

    botUserId = me.id;
    console.log(`🤖 Bot user ID initialized: ${botUserId}`);
  } catch (err) {
    console.error(
      '❌ Failed to initialize bot user ID:',
      (err as Error).message,
    );
    process.exit(1);
  }
}

export function getBotUserId(): number {
  if (botUserId === null) {
    throw new Error('Bot user ID has not been initialized yet.');
  }
  return botUserId;
}
