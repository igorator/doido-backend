import crypto from 'crypto';

export function checkTelegramInitData(
  params: Record<string, string>,
  botToken: string,
) {
  const { hash } = params;

  if (!hash) {
    console.warn('⚠️ Missing hash in initData');
    return { valid: false, reason: 'Missing hash', user: null };
  }

  const queryString = Object.keys(params)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('hex');

  const valid = computedHash === hash;

  if (!valid) {
    console.warn('❌ Hash mismatch. Computed:', computedHash, '!=', hash);
  }

  let user = null;
  try {
    user = params.user ? JSON.parse(params.user) : null;
  } catch (err) {
    console.error('❌ Failed to parse user:', err);
  }

  return {
    valid,
    reason: valid ? null : 'Hash mismatch',
    user: valid ? user : null,
  };
}
