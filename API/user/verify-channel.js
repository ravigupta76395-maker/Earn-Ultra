import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { getAllSettings } from '../../../lib/settings';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { telegramId, deviceId } = req.body;
  if (!telegramId) return res.status(400).json({ error: 'Missing telegramId' });

  await dbConnect();
  const settings = await getAllSettings();
  const channelId = settings.channelId || settings.channelUsername;

  if (!channelId) {
    return res.status(200).json({ joined: true, message: 'No channel configured' });
  }

  try {
    const checkId = channelId.startsWith('@') ? channelId : `@${channelId}`;
    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMember?chat_id=${checkId}&user_id=${telegramId}`
    );
    const data = await tgRes.json();

    if (!data.ok) {
      return res.status(200).json({ joined: false, message: 'Could not verify' });
    }

    const status = data.result?.status;
    const joined = ['member', 'administrator', 'creator'].includes(status);

    if (joined) {
      // Check device uniqueness
      const existingDevice = await User.findOne({ deviceId, telegramId: { $ne: String(telegramId) } });
      if (existingDevice && deviceId) {
        return res.status(200).json({ joined: false, message: 'Device already registered', deviceBlocked: true });
      }

      let user = await User.findOne({ telegramId: String(telegramId) });
      if (user && !user.channelJoined) {
        user.channelJoined = true;
        user.isVerified = true;
        if (deviceId) user.deviceId = deviceId;
        if (!user.joinBonus) {
          user.balance += settings.joinBonus || 5;
          user.totalEarned += settings.joinBonus || 5;
          user.joinBonus = true;
        }
        await user.save();
      }
    }

    return res.status(200).json({ joined, status });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
