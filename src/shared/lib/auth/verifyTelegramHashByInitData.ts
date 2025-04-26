import crypto from 'crypto';

export function checkTelegramInitData(
  params: Record<string, string>,
  botToken: string,
): { valid: boolean; reason?: string; user?: any } {
  const { hash, ...rest } = params;
  if (!hash) return { valid: false, reason: 'Missing hash' };

  const dataCheckString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== hash) {
    return { valid: false, reason: 'Hash mismatch' };
  }

  if (!rest.user) return { valid: false, reason: 'Missing user' };

  try {
    const user = JSON.parse(rest.user);
    return { valid: true, user };
  } catch {
    return { valid: false, reason: 'Invalid JSON in user field' };
  }
}
