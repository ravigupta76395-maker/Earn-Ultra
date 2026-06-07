import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { telegramId } = req.query;
  await dbConnect();

  const totalUsers = await User.countDocuments();
  const totalWithdrawals = await User.aggregate([
    { $unwind: '$withdrawals' },
    { $group: { _id: null, total: { $sum: '$withdrawals.amount' } } }
  ]);

  let myStats = null;
  if (telegramId) {
    const user = await User.findOne({ telegramId: String(telegramId) });
    if (user) {
      myStats = {
        balance: user.balance,
        totalEarned: user.totalEarned,
        referralCount: user.referralCount,
        totalWithdrawn: user.withdrawals.filter(w => w.status === 'approved').reduce((a, b) => a + b.amount, 0),
        pendingWithdrawals: user.withdrawals.filter(w => w.status === 'pending').length,
        joinedAt: user.createdAt,
      };
    }
  }

  return res.status(200).json({
    totalUsers,
    totalPaid: totalWithdrawals[0]?.total || 0,
    myStats,
  });
}
