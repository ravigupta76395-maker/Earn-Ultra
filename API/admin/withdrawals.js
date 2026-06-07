import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';

function verifyAdmin(req) {
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  return secret === process.env.ADMIN_SECRET;
}

export default async function handler(req, res) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  await dbConnect();

  if (req.method === 'GET') {
    const status = req.query.status || 'pending';
    const users = await User.find({ 'withdrawals.0': { $exists: true } });
    
    const withdrawals = [];
    users.forEach(user => {
      user.withdrawals.forEach(w => {
        if (status === 'all' || w.status === status) {
          withdrawals.push({
            _id: w._id,
            telegramId: user.telegramId,
            firstName: user.firstName,
            username: user.username,
            amount: w.amount,
            paymentInfo: w.paymentInfo,
            status: w.status,
            createdAt: w.createdAt,
          });
        }
      });
    });

    withdrawals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json(withdrawals);
  }

  if (req.method === 'PATCH') {
    const { telegramId, withdrawalId, status } = req.body;
    const user = await User.findOne({ telegramId: String(telegramId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const withdrawal = user.withdrawals.id(withdrawalId);
    if (!withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });

    if (status === 'rejected' && withdrawal.status === 'pending') {
      user.balance += withdrawal.amount; // refund
    }

    withdrawal.status = status;
    await user.save();

    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
