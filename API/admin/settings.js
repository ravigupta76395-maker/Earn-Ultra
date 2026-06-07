import dbConnect from '../../../lib/dbConnect';
import { getAllSettings, setSetting } from '../../../lib/settings';

function verifyAdmin(req) {
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  return secret === process.env.ADMIN_SECRET;
}

export default async function handler(req, res) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  await dbConnect();

  if (req.method === 'GET') {
    const settings = await getAllSettings();
    return res.status(200).json(settings);
  }

  if (req.method === 'POST') {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await setSetting(key, value);
    }
    return res.status(200).json({ success: true, message: 'Settings updated' });
  }

  return res.status(405).end();
}
