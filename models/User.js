import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String, default: '' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  referralCount: { type: Number, default: 0 },
  deviceId: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  channelJoined: { type: Boolean, default: false },
  joinBonus: { type: Boolean, default: false },
  withdrawals: [{
    amount: Number,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    paymentInfo: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
