import crypto from 'crypto';

export function verifyTelegramAuth(initData) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    urlParams.delete('hash');
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}=${val}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN)
      .digest();

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (expectedHash !== hash) return null;

    const userParam = urlParams.get('user');
    if (!userParam) return null;

    return JSON.parse(decodeURIComponent(userParam));
  } catch (e) {
    return null;
  }
}

export function getTelegramUser(initData) {
  try {
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get('user');
    if (!userParam) return null;
    return JSON.parse(decodeURIComponent(userParam));
  } catch {
    return null;
  }
}
