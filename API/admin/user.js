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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    return res.status(200).json({ users, total, page, pages: Math.ceil(total / limit) });
  }

  // Update user balance
  if (req.method === 'PATCH') {
    const { telegramId, balance, action } = req.body;
    const user = await User.findOne({ telegramId: String(telegramId) });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (action === 'add') {
      user.balance += balance;
      user.totalEarned += balance;
    } else if (action === 'set') {
      user.balance = balance;
    } else if (action === 'ban') {
      user.isVerified = false;
      user.channelJoined = false;
    }
    await user.save();
    return res.status(200).json({ success: true, user });
  }

  return res.status(405).end();
}
