# ⚡ Earn Ultra Mini

A full-stack Telegram Mini App with referral system, device verification, and payment gateway.

---

## 📁 File Structure

```
earn-ultra-mini/
├── index.js              ← Express server + Bot + All API routes
├── package.json          ← Dependencies
├── vercel.json           ← Vercel deployment config
└── public/
    ├── index.html        ← Main Web App (user-facing)
    ├── admin.html        ← Admin Panel
    └── admin-login.html  ← Admin Login
```

---

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial: Earn Ultra Mini"
git remote add origin https://github.com/YOUR_USERNAME/earn-ultra-mini.git
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Add Environment Variables:

| Variable | Value |
|---|---|
| `MONGO_URI` | `mongodb+srv://rg15756448_db_user:UD56WE02WvpJ5215@cluster0.nss1pnd.mongodb.net/referapp?...` |
| `BOT_TOKEN` | `8863923029:AAGGMNF5CCfjbHcoapJU4Cadsm1zqjJlk1U` |
| `WEB_APP_URL` | `https://YOUR-VERCEL-URL.vercel.app` |
| `SESSION_SECRET` | Any random string like `earnultra_xyz_2024` |

4. Deploy!

### Step 3: Set Telegram WebApp
After deploy, go to [@BotFather](https://t.me/BotFather):
```
/setmenubutton → @EarnUltraMiniiBot → Set button URL: https://YOUR-VERCEL-URL.vercel.app
```

Also set:
```
/setdomain → @EarnUltraMiniiBot → YOUR-VERCEL-URL.vercel.app
```

---

## 🔐 Admin Panel

URL: `https://YOUR-VERCEL-URL.vercel.app/admin`

Default password: `admin123` (change in Admin → Settings)

### Admin Features:
- 📊 Dashboard with live stats
- 👥 User management (add/remove balance)
- 💸 Withdrawal history with filters
- 📢 Add required Telegram channels (bot must be admin)
- ⚙️ Settings: invite bonus, API URL, payout channel, verification mode
- 🏦 Manage withdrawal: min/max, tax %, cooldown hours
- 📣 Broadcast to all users or specific channel

---

## 🤖 Bot Features
- Channel join verification before app access
- Device fingerprint: 1 mobile = 1 account
- Referral system with configurable bonus
- Withdrawal notifications
- Invite link sharing

---

## 💡 How Withdrawal Works
1. User enters amount + phone number
2. System checks: min/max, balance, cooldown
3. Tax deducted (if set by admin)
4. API called: `{API_URL}` with `{number}` and `{amount}` replaced
5. Payout channel gets full notification
6. User gets Telegram message

---

## 📱 User App Tabs
- **Home**: Balance card, invite link, copy/share
- **Leaderboard**: Global rankings + My referrals
- **Withdrawal**: Amount input, phone, history
- **Stats**: App-wide statistics

---

## ⚠️ Security Note
Rotate credentials after deployment:
- Change MongoDB password
- Change admin panel password  
- Generate a new session secret
