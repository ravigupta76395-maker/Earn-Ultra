import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { getAllSettings } from '../../../lib/settings';
import crypto from 'crypto';

function generateReferralCode(telegramId) {
  return 'EU' + telegramId.toString().slice(-4) + crypto.randomBytes(2).toString('hex').toUpperCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { telegramId, username, firstName, lastName, referCode, deviceId } = req.body;
  if (!telegramId) return res.status(400).json({ error: 'Missing telegramId' });

  await dbConnect();
  const settings = await getAllSettings();

  let user = await User.findOne({ telegramId: String(telegramId) });

  if (!user) {
    // New user
    const referralCode = generateReferralCode(telegramId);
    user = new User({
      telegramId: String(telegramId),
      username: username || '',
      firstName: firstName || '',
      lastName: lastName || '',
      referralCode,
      deviceId: deviceId || null,
    });

    // Handle referral
    if (referCode) {
      const referrer = await User.findOne({ referralCode: referCode });
      if (referrer && referrer.telegramId !== String(telegramId)) {
        user.referredBy = referrer.telegramId;
        // Give referrer bonus
        referrer.balance += settings.referralBonus || 10;
        referrer.totalEarned += settings.referralBonus || 10;
        referrer.referralCount += 1;
        await referrer.save();
      }
    }

    await user.save();
  } else {
    // Update last active & info
    user.lastActive = new Date();
    if (username) user.username = username;
    if (firstName) user.firstName = firstName;
    await user.save();
  }

  return res.status(200).json({
    user: {
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      balance: user.balance,
      totalEarned: user.totalEarned,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      isVerified: user.isVerified,
      channelJoined: user.channelJoined,
      deviceId: user.deviceId,
    },
    settings: {
      referralBonus: settings.referralBonus,
      joinBonus: settings.joinBonus,
      minWithdrawal: settings.minWithdrawal,
      channelUsername: settings.channelUsername,
      channelId: settings.channelId,
      appName: settings.appName,
    }
  });
      }
