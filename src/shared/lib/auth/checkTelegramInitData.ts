import crypto from 'crypto';

const MAX_INIT_DATA_AGE_SEC = 3600;

export function checkTelegramInitData(params: Record<string, string>, botToken: string) {
  const { hash, auth_date } = params;

  if (!hash) {
    return { valid: false, reason: 'Missing hash', user: null };
  }

  const authDateSec = Number(auth_date);
  if (!auth_date || isNaN(authDateSec)) {
    return { valid: false, reason: 'Missing auth_date', user: null };
  }

  const ageSec = Math.floor(Date.now() / 1000) - authDateSec;
  if (ageSec > MAX_INIT_DATA_AGE_SEC) {
    return { valid: false, reason: `initData expired (age: ${ageSec}s)`, user: null };
  }

  const queryString = Object.keys(params)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

  const computedHash = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');

  let hashesMatch = false;
  try {
    hashesMatch = crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(hash, 'hex'),
    );
  } catch {
    hashesMatch = false;
  }

  if (!hashesMatch) {
    return { valid: false, reason: 'Hash mismatch', user: null };
  }

  let user = null;
  try {
    user = params.user ? JSON.parse(params.user) : null;
  } catch {
    return { valid: false, reason: 'Failed to parse user field', user: null };
  }

  return { valid: true, reason: null, user };
}
