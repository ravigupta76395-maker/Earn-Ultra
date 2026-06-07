import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { getAllSettings } from '../../../lib/settings';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { telegramId, amount, paymentInfo } = req.body;
  if (!telegramId || !amount || !paymentInfo) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  await dbConnect();
  const settings = await getAllSettings();

  if (!settings.withdrawalEnabled) {
    return res.status(400).json({ error: 'Withdrawals are currently disabled' });
  }

  const minWithdrawal = settings.minWithdrawal || 100;
  if (amount < minWithdrawal) {
    return res.status(400).json({ error: `Minimum withdrawal is ₹${minWithdrawal}` });
  }

  const user = await User.findOne({ telegramId: String(telegramId) });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

  // Deduct balance and create withdrawal
  user.balance -= amount;
  user.withdrawals.push({ amount, paymentInfo, status: 'pending' });
  await user.save();

  // Call payment API if configured
  if (settings.paymentApiUrl) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (settings.paymentApiKey) headers['Authorization'] = `Bearer ${settings.paymentApiKey}`;

      await fetch(settings.paymentApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          telegramId,
          amount,
          paymentInfo,
          userId: user._id,
        }),
      });
    } catch (e) {
      console.error('Payment API error:', e.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Withdrawal request submitted',
    newBalance: user.balance,
  });
}
