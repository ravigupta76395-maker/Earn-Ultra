import Settings from '../models/Settings';

const DEFAULTS = {
  referralBonus: 10,
  joinBonus: 5,
  minWithdrawal: 100,
  paymentApiUrl: '',
  paymentApiKey: '',
  channelUsername: '',
  channelId: '',
  appName: 'Earn Ultra',
  withdrawalEnabled: true,
};

export async function getSetting(key) {
  const setting = await Settings.findOne({ key });
  if (setting) return setting.value;
  return DEFAULTS[key] ?? null;
}

export async function getAllSettings() {
  const settings = await Settings.find({});
  const result = { ...DEFAULTS };
  settings.forEach(s => {
    result[s.key] = s.value;
  });
  return result;
}

export async function setSetting(key, value) {
  await Settings.findOneAndUpdate(
    { key },
    { value, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}
