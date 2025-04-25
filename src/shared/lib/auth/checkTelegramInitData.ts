import crypto from 'crypto';
import querystring from 'querystring';

export const checkTelegramInitData = (
  initData: string,
  botToken: string,
): Record<string, string> => {
  const parsed = querystring.parse(initData);
  const hash = parsed.hash as string;

  if (!hash) {
    throw new Error('Missing initData hash');
  }

  delete parsed.hash;

  const dataCheckString = Object.keys(parsed)
    .sort()
    .map((key) => `${key}=${parsed[key]}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) {
    throw new Error('Invalid Telegram initData hash');
  }

  return parsed as Record<string, string>;
};
