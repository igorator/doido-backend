export const logger = {
  withdraw: (...args: any[]) => console.log('[Withdraw]', ...args),
  watcher: (...args: any[]) => console.log('[Withdraw Watcher]', ...args),
  error: (...args: any[]) => console.error('[❌ ERROR]', ...args),
};
