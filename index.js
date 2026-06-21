const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Config ───────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://rg15756448_db_user:UD56WE02WvpJ5215@cluster0.nss1pnd.mongodb.net/referapp?retryWrites=true&w=majority&appName=Cluster0';
const BOT_TOKEN = process.env.BOT_TOKEN || '8863923029:AAGGMNF5CCfjbHcoapJU4Cadsm1zqjJlk1U';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://earn-ultra-rk5a.vercel.app';
const WEBHOOK_PATH = `/webhook/${BOT_TOKEN}`;

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(MONGO_URI).then(() => console.log('MongoDB Connected')).catch(err => console.error('MongoDB Error:', err));

// ─── Bot (NO polling - webhook mode for Vercel) ───────────────────────────────
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// ─── Schemas ──────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  username: String,
  firstName: String,
  balance: { type: Number, default: 0 },
  deviceId: { type: String, default: null },
  verified: { type: Boolean, default: false },
  referredBy: { type: String, default: null },
  referralCode: { type: String, unique: true },
  referralCount: { type: Number, default: 0 },
  phoneNumber: { type: String, default: null },
  lastWithdrawal: { type: Date, default: null },
  joinedAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed
});

const withdrawalSchema = new mongoose.Schema({
  userId: String,
  telegramId: String,
  username: String,
  amount: Number,
  netAmount: Number,
  phoneNumber: String,
  status: { type: String, default: 'pending' },
  gateway: String,
  apiResponse: String,
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  telegramId: String,
  type: { type: String, enum: ['credit', 'debit', 'referral', 'withdrawal'] },
  amount: Number,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Settings = mongoose.model('Settings', settingsSchema);
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// ─── Settings Helpers ─────────────────────────────────────────────────────────
async function getSetting(key, defaultVal = null) {
  const s = await Settings.findOne({ key });
  return s ? s.value : defaultVal;
}
async function setSetting(key, value) {
  await Settings.findOneAndUpdate({ key }, { value }, { upsert: true });
}

async function initSettings() {
  const defaults = {
    referAmount: 10,
    minWithdrawal: 50,
    maxWithdrawal: 5000,
    withdrawalTax: 0,
    cooldownHours: 24,
    withdrawalEnabled: true,
    botEnabled: true,
    verificationMode: 'device',
    apiPaymentUrl: 'https://ultra-pay.store/APIs/api?token=pBD22DfWxXCsYxxG34rampbRWtEDyrvK&key=mxYoHxxA07021pK&paytoNumber={number}&amount={amount}&comment=Payment',
    payoutChannelId: null,
    requiredChannels: [],
    inviteBonus: 10,
    adminIds: ['1234567890']
  };
  for (const [key, value] of Object.entries(defaults)) {
    const exists = await Settings.findOne({ key });
    if (!exists) await setSetting(key, value);
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'earnultra_secret_2024',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// ─── Admin Auth ───────────────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  if (req.session.adminLoggedIn) return next();
  res.redirect('/admin/login');
}

// ─── Webhook Setup (auto on first request) ───────────────────────────────────
let webhookSet = false;
async function ensureWebhook() {
  if (webhookSet) return;
  try {
    const webhookUrl = `${WEB_APP_URL}${WEBHOOK_PATH}`;
    await bot.setWebHook(webhookUrl);
    webhookSet = true;
    console.log('Webhook set:', webhookUrl);
  } catch (e) {
    console.error('Webhook error:', e.message);
  }
}

// ─── Webhook Route (Telegram sends updates here) ─────────────────────────────
app.post(WEBHOOK_PATH, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ─── Set Webhook Manually ─────────────────────────────────────────────────────
app.get('/set-webhook', async (req, res) => {
  try {
    const webhookUrl = `${WEB_APP_URL}${WEBHOOK_PATH}`;
    await bot.setWebHook(webhookUrl);
    res.json({ success: true, webhook: webhookUrl });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── Pages ────────────────────────────────────────────────────────────────────
app.get('/', async (req, res) => {
  await ensureWebhook();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/admin', adminAuth, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-login.html')));

// ─── Admin Login ──────────────────────────────────────────────────────────────
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  const adminPassword = await getSetting('adminPassword', 'admin123');
  if (password === adminPassword) {
    req.session.adminLoggedIn = true;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Wrong password' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ─── User Init ────────────────────────────────────────────────────────────────
app.post('/api/user/init', async (req, res) => {
  try {
    const { telegramId, username, firstName, referCode, deviceId } = req.body;
    if (!telegramId) return res.json({ success: false, message: 'No telegramId' });

    const channels = await getSetting('requiredChannels', []);
    for (const ch of channels) {
      try {
        const member = await bot.getChatMember(ch.channelId, telegramId);
        if (!['member', 'administrator', 'creator'].includes(member.status)) {
          return res.json({ success: false, needChannelJoin: true, channels });
        }
      } catch (e) {}
    }

    let user = await User.findOne({ telegramId: String(telegramId) });
    if (!user) {
      const refCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      user = new User({
        telegramId: String(telegramId),
        username,
        firstName,
        referralCode: refCode
      });

      if (referCode) {
        const referrer = await User.findOne({ referralCode: referCode });
        if (referrer && referrer.telegramId !== String(telegramId)) {
          user.referredBy = referrer.telegramId;
          const inviteBonus = await getSetting('inviteBonus', 10);
          referrer.balance += inviteBonus;
          referrer.referralCount += 1;
          await referrer.save();
          await Transaction.create({ telegramId: referrer.telegramId, type: 'referral', amount: inviteBonus, description: `Referral bonus from ${firstName}` });
          try { await bot.sendMessage(referrer.telegramId, `🎉 *Invite Bonus!*\n\n${firstName} joined using your link!\n+₹${inviteBonus} added to your balance.`, { parse_mode: 'Markdown' }); } catch (e) {}
        }
      }
      await user.save();
    }

    const verMode = await getSetting('verificationMode', 'device');
    let verified = user.verified;
    if (!verified && verMode === 'device' && deviceId) {
      const existingDevice = await User.findOne({ deviceId, verified: true, telegramId: { $ne: String(telegramId) } });
      if (!existingDevice) {
        user.deviceId = deviceId;
        user.verified = true;
        verified = true;
        await user.save();
      }
    } else if (!verified && verMode === 'none') {
      user.verified = true;
      verified = true;
      await user.save();
    }

    res.json({
      success: true,
      user: {
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        balance: user.balance,
        verified: user.verified,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        phoneNumber: user.phoneNumber
      },
      channels,
      needVerification: !verified
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/user/verify-device', async (req, res) => {
  try {
    const { telegramId, deviceId } = req.body;
    const verMode = await getSetting('verificationMode', 'device');
    if (verMode === 'captcha') return res.json({ success: false, message: 'Captcha verification required' });
    const existing = await User.findOne({ deviceId, verified: true, telegramId: { $ne: String(telegramId) } });
    if (existing) return res.json({ success: false, message: 'Device already used by another account' });
    const user = await User.findOneAndUpdate({ telegramId: String(telegramId) }, { deviceId, verified: true }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.get('/api/user/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) return res.json({ success: false });
    const settings = {
      minWithdrawal: await getSetting('minWithdrawal', 50),
      maxWithdrawal: await getSetting('maxWithdrawal', 5000),
      withdrawalEnabled: await getSetting('withdrawalEnabled', true),
      inviteBonus: await getSetting('inviteBonus', 10),
      withdrawalTax: await getSetting('withdrawalTax', 0)
    };
    res.json({ success: true, user, settings });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const top = await User.find({ verified: true }).sort({ referralCount: -1 }).limit(20).select('firstName username referralCount telegramId');
    res.json({ success: true, leaderboard: top });
  } catch (err) { res.json({ success: false }); }
});

app.get('/api/my-referrals/:telegramId', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) return res.json({ success: false });
    const referrals = await User.find({ referredBy: req.params.telegramId }).select('firstName username joinedAt');
    res.json({ success: true, referrals, count: user.referralCount, inviteBonus: await getSetting('inviteBonus', 10) });
  } catch (err) { res.json({ success: false }); }
});

app.post('/api/user/set-phone', async (req, res) => {
  try {
    const { telegramId, phoneNumber } = req.body;
    await User.findOneAndUpdate({ telegramId }, { phoneNumber });
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// ─── Withdrawal ───────────────────────────────────────────────────────────────
app.post('/api/withdrawal/request', async (req, res) => {
  try {
    const { telegramId, amount, phoneNumber } = req.body;
    const withdrawalEnabled = await getSetting('withdrawalEnabled', true);
    if (!withdrawalEnabled) return res.json({ success: false, message: 'Withdrawals are currently disabled' });

    const user = await User.findOne({ telegramId });
    if (!user) return res.json({ success: false, message: 'User not found' });
    if (!user.verified) return res.json({ success: false, message: 'Please verify your device first' });

    const minW = await getSetting('minWithdrawal', 50);
    const maxW = await getSetting('maxWithdrawal', 5000);
    const tax = await getSetting('withdrawalTax', 0);
    const cooldown = await getSetting('cooldownHours', 24);

    if (amount < minW) return res.json({ success: false, message: `Minimum withdrawal is Rs.${minW}` });
    if (amount > maxW) return res.json({ success: false, message: `Maximum withdrawal is Rs.${maxW}` });
    if (user.balance < amount) return res.json({ success: false, message: 'Insufficient balance' });

    if (user.lastWithdrawal) {
      const diff = (Date.now() - new Date(user.lastWithdrawal).getTime()) / (1000 * 60 * 60);
      if (diff < cooldown) {
        const remaining = Math.ceil(cooldown - diff);
        return res.json({ success: false, message: `Cooldown active. Try again in ${remaining} hour(s)` });
      }
    }

    const taxAmount = (amount * tax) / 100;
    const netAmount = amount - taxAmount;
    const apiUrl = await getSetting('apiPaymentUrl', '');
    const phone = phoneNumber || user.phoneNumber;
    if (!phone) return res.json({ success: false, message: 'Please set your phone number first' });

    const gatewayBase = apiUrl.split('/APIs')[0] || apiUrl.split('?')[0];
    const finalUrl = apiUrl.replace('{number}', phone).replace('{amount}', netAmount);

    let apiResp = 'pending';
    let status = 'pending';
    try {
      const resp = await axios.get(finalUrl, { timeout: 10000 });
      apiResp = JSON.stringify(resp.data);
      status = 'success';
    } catch (e) {
      apiResp = e.message;
      status = 'failed';
    }

    const oldBalance = user.balance;
    user.balance -= amount;
    user.lastWithdrawal = new Date();
    if (phone) user.phoneNumber = phone;
    await user.save();

    await Transaction.create({ telegramId, type: 'withdrawal', amount: -amount, description: `Withdrawal Rs.${netAmount} to ${phone}` });

    const withdrawal = await Withdrawal.create({
      userId: user._id, telegramId, username: user.username || user.firstName,
      amount, netAmount, phoneNumber: phone, status, gateway: gatewayBase, apiResponse: apiResp
    });

    const payoutChannelId = await getSetting('payoutChannelId', null);
    if (payoutChannelId) {
      const emoji = status === 'success' ? 'SUCCESS' : 'FAILED';
      const msg = `${emoji === 'SUCCESS' ? '✅' : '❌'} *Withdrawal ${emoji}*\n\n` +
        `👤 User: ${user.firstName || user.username} (@${user.username || 'N/A'})\n` +
        `🆔 Telegram ID: \`${telegramId}\`\n` +
        `💸 Amount: Rs.${amount}\n` +
        `🧾 Net Received: Rs.${netAmount}${tax > 0 ? ` (${tax}% tax)` : ''}\n` +
        `📱 Number: \`${phone}\`\n` +
        `💰 Old Balance: Rs.${oldBalance}\n` +
        `💰 New Balance: Rs.${user.balance}\n` +
        `🌐 Gateway: ${gatewayBase}\n` +
        `📅 Time: ${new Date().toLocaleString('en-IN')}`;
      try { await bot.sendMessage(payoutChannelId, msg, { parse_mode: 'Markdown' }); } catch (e) {}
    }

    const userMsg = status === 'success'
      ? `✅ *Withdrawal Successful!*\n\nAmount: Rs.${amount}\nReceived: Rs.${netAmount}\nNumber: ${phone}`
      : `❌ *Withdrawal Failed*\n\nAmount: Rs.${amount}\nPlease contact support.`;
    try { await bot.sendMessage(telegramId, userMsg, { parse_mode: 'Markdown' }); } catch (e) {}

    res.json({ success: true, status, netAmount, withdrawal: withdrawal._id });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ verified: true });
    const totalWithdrawals = await Withdrawal.countDocuments({ status: 'success' });
    const totalPaid = await Withdrawal.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$netAmount' } } }]);
    const inviteBonus = await getSetting('inviteBonus', 10);
    const minW = await getSetting('minWithdrawal', 50);
    res.json({ success: true, stats: { totalUsers, verifiedUsers, totalWithdrawals, totalPaid: totalPaid[0]?.total || 0, inviteBonus, minWithdrawal: minW } });
  } catch (err) { res.json({ success: false }); }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────
app.get('/api/admin/settings', adminAuth, async (req, res) => {
  try {
    const settings = {};
    const keys = ['referAmount', 'minWithdrawal', 'maxWithdrawal', 'withdrawalTax', 'cooldownHours', 'withdrawalEnabled', 'botEnabled', 'verificationMode', 'apiPaymentUrl', 'payoutChannelId', 'requiredChannels', 'inviteBonus', 'adminPassword'];
    for (const k of keys) settings[k] = await getSetting(k);
    res.json({ success: true, settings });
  } catch (err) { res.json({ success: false }); }
});

app.post('/api/admin/settings', adminAuth, async (req, res) => {
  try {
    const allowed = ['referAmount', 'minWithdrawal', 'maxWithdrawal', 'withdrawalTax', 'cooldownHours', 'withdrawalEnabled', 'botEnabled', 'verificationMode', 'apiPaymentUrl', 'payoutChannelId', 'inviteBonus', 'adminPassword'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) await setSetting(key, req.body[key]);
    }
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const search = req.query.search || '';
    const query = search ? { $or: [{ username: new RegExp(search, 'i') }, { firstName: new RegExp(search, 'i') }, { telegramId: new RegExp(search, 'i') }] } : {};
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ joinedAt: -1 }).skip((page - 1) * limit).limit(limit);
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.json({ success: false }); }
});

app.post('/api/admin/balance', adminAuth, async (req, res) => {
  try {
    const { telegramId, amount, action } = req.body;
    const user = await User.findOne({ telegramId });
    if (!user) return res.json({ success: false, message: 'User not found' });
    const amt = parseFloat(amount);
    if (action === 'add') {
      user.balance += amt;
      await Transaction.create({ telegramId, type: 'credit', amount: amt, description: 'Admin credit' });
      try { await bot.sendMessage(telegramId, `✅ *Balance Added*\n\n+Rs.${amt} added by admin.\nNew Balance: Rs.${user.balance}`, { parse_mode: 'Markdown' }); } catch (e) {}
    } else {
      user.balance = Math.max(0, user.balance - amt);
      await Transaction.create({ telegramId, type: 'debit', amount: -amt, description: 'Admin debit' });
      try { await bot.sendMessage(telegramId, `⚠️ *Balance Deducted*\n\n-Rs.${amt} deducted by admin.\nNew Balance: Rs.${user.balance}`, { parse_mode: 'Markdown' }); } catch (e) {}
    }
    await user.save();
    res.json({ success: true, newBalance: user.balance });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

app.post('/api/admin/broadcast', adminAuth, async (req, res) => {
  try {
    const { message, target } = req.body;
    const users = await User.find({ verified: true });
    let sent = 0, failed = 0;
    if (target === 'bot') {
      for (const u of users) {
        try { await bot.sendMessage(u.telegramId, message, { parse_mode: 'Markdown' }); sent++; } catch (e) { failed++; }
        await new Promise(r => setTimeout(r, 50));
      }
    } else {
      try { await bot.sendMessage(target, message, { parse_mode: 'Markdown' }); sent = 1; } catch (e) { failed = 1; }
    }
    res.json({ success: true, sent, failed });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

app.get('/api/admin/channels', adminAuth, async (req, res) => {
  const channels = await getSetting('requiredChannels', []);
  res.json({ success: true, channels });
});

app.post('/api/admin/channels/add', adminAuth, async (req, res) => {
  try {
    const { channelId, channelName, inviteLink } = req.body;
    try {
      const me = await bot.getMe();
      const member = await bot.getChatMember(channelId, me.id);
      if (!['administrator', 'creator'].includes(member.status)) {
        return res.json({ success: false, message: 'Bot is not an admin in that channel' });
      }
    } catch (e) {
      return res.json({ success: false, message: 'Cannot verify bot admin status: ' + e.message });
    }
    const channels = await getSetting('requiredChannels', []);
    channels.push({ channelId, channelName, inviteLink });
    await setSetting('requiredChannels', channels);
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

app.post('/api/admin/channels/remove', adminAuth, async (req, res) => {
  try {
    const { channelId } = req.body;
    let channels = await getSetting('requiredChannels', []);
    channels = channels.filter(c => c.channelId !== channelId);
    await setSetting('requiredChannels', channels);
    res.json({ success: true });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

app.get('/api/admin/withdrawals', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const status = req.query.status || '';
    const query = status ? { status } : {};
    const total = await Withdrawal.countDocuments(query);
    const withdrawals = await Withdrawal.find(query).sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20);
    res.json({ success: true, withdrawals, total });
  } catch (err) { res.json({ success: false }); }
});

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ verified: true });
    const totalWithdrawals = await Withdrawal.countDocuments();
    const successW = await Withdrawal.countDocuments({ status: 'success' });
    const pendingW = await Withdrawal.countDocuments({ status: 'pending' });
    const totalPaid = await Withdrawal.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$netAmount' } } }]);
    const totalBalance = await User.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]);
    res.json({ success: true, stats: { totalUsers, verifiedUsers, totalWithdrawals, successW, pendingW, totalPaid: totalPaid[0]?.total || 0, totalBalance: totalBalance[0]?.total || 0 } });
  } catch (err) { res.json({ success: false }); }
});

// ─── Bot Handlers ─────────────────────────────────────────────────────────────
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = String(msg.from.id);
  const param = match[1].trim();
  const refCode = param.startsWith('ref_') ? param.replace('ref_', '') : null;

  const botEnabled = await getSetting('botEnabled', true);
  if (!botEnabled) return bot.sendMessage(chatId, 'Bot is currently offline. Please try again later.');

  const channels = await getSetting('requiredChannels', []);
  const notJoined = [];
  for (const ch of channels) {
    try {
      const member = await bot.getChatMember(ch.channelId, telegramId);
      if (!['member', 'administrator', 'creator'].includes(member.status)) notJoined.push(ch);
    } catch (e) { notJoined.push(ch); }
  }

  if (notJoined.length > 0) {
    const buttons = notJoined.map(ch => [{ text: `Join ${ch.channelName}`, url: ch.inviteLink }]);
    buttons.push([{ text: 'I Joined All Channels', callback_data: `check_joined:${refCode || ''}` }]);
    return bot.sendMessage(chatId,
      `*Join Required Channels*\n\nTo use *Earn Ultra Mini*, please join all channels below:`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } }
    );
  }

  sendWelcome(chatId, telegramId, msg.from, refCode);
});

async function sendWelcome(chatId, telegramId, from, refCode) {
  const inviteBonus = await getSetting('inviteBonus', 10);
  const appUrl = refCode
    ? `${WEB_APP_URL}?ref=${refCode}&tid=${telegramId}`
    : `${WEB_APP_URL}?tid=${telegramId}`;

  await bot.sendMessage(chatId,
    `*Welcome to Earn Ultra Mini!*\n\n` +
    `Earn Rs.${inviteBonus} for every friend you invite!\n` +
    `One device = One account\n` +
    `Withdraw directly to your number\n\n` +
    `Click below to open the app`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Open Earn Ultra Mini', web_app: { url: appUrl } }],
          [{ text: 'Invite Friends', callback_data: `share:${telegramId}` }]
        ]
      }
    }
  );
}

bot.on('callback_query', async (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  const telegramId = String(query.from.id);

  if (data.startsWith('check_joined:')) {
    const refCode = data.split(':')[1];
    const channels = await getSetting('requiredChannels', []);
    const notJoined = [];
    for (const ch of channels) {
      try {
        const member = await bot.getChatMember(ch.channelId, telegramId);
        if (!['member', 'administrator', 'creator'].includes(member.status)) notJoined.push(ch);
      } catch (e) { notJoined.push(ch); }
    }

    if (notJoined.length > 0) {
      const buttons = notJoined.map(ch => [{ text: `Join ${ch.channelName}`, url: ch.inviteLink }]);
      buttons.push([{ text: 'I Joined All Channels', callback_data: `check_joined:${refCode}` }]);
      await bot.answerCallbackQuery(query.id, { text: 'Please join all channels first!', show_alert: true });
      return bot.editMessageReplyMarkup({ inline_keyboard: buttons }, { chat_id: chatId, message_id: query.message.message_id });
    }

    await bot.answerCallbackQuery(query.id, { text: 'All channels joined!', show_alert: false });
    await bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
    sendWelcome(chatId, telegramId, query.from, refCode || null);
  }

  if (data.startsWith('share:')) {
    const tid = data.split(':')[1];
    const user = await User.findOne({ telegramId: tid });
    if (user) {
      const link = `https://t.me/EarnUltraMiniiBot?start=ref_${user.referralCode}`;
      await bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, `*Your Invite Link:*\n\n\`${link}\`\n\nShare with friends to earn rewards!`, { parse_mode: 'Markdown' });
    }
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
mongoose.connection.once('open', async () => {
  await initSettings();
  app.listen(PORT, () => console.log(`Earn Ultra Mini running on port ${PORT}`));
});

module.exports = app;
