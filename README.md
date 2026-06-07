# 💰 Earn Ultra — Telegram Mini App

Refer & Earn Telegram Mini App with full admin panel.

---

## 🚀 Deploy on Vercel (Step by Step)

### Step 1: GitHub pe upload karo

1. GitHub.com pe jaao → New Repository banao: `earn-ultra`
2. Ye saare files upload karo (ya git use karo)

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/earn-ultra.git
git push -u origin main
```

### Step 2: Vercel pe deploy karo

1. https://vercel.com jaao → Login karo
2. "Add New Project" → GitHub repo select karo
3. **Environment Variables** add karo:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://rg15756448_db_user:UD56WE02WvpJ5215@cluster0.nss1pnd.mongodb.net/referapp?retryWrites=true&w=majority&appName=Cluster0` |
| `BOT_TOKEN` | `8952164961:AAGPm_1WVz6kgCmKmgXg8rGoeNyLwDNCyw4` |
| `ADMIN_SECRET` | `earnultra_admin_2024` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` (deploy ke baad update karo) |

4. Deploy! ✅

---

### Step 3: Telegram Bot Setup

BotFather pe jaao:
```
/newapp → apna bot select karo
Title: Earn Ultra
Description: Refer friends & earn real cash!
Web App URL: https://your-vercel-url.vercel.app
```

Ya Web App set karne ke liye:
```
/setmenubutton → bot select karo → URL enter karo
```

---

### Step 4: Admin Panel

URL: `https://your-app.vercel.app/admin`
Password: `earnultra_admin_2024`

Admin Panel mein:
- ✅ Channel Username set karo (e.g. `@yourchannel`)
- ✅ Referral Bonus set karo
- ✅ Min Withdrawal set karo
- ✅ Payment API URL set karo
- ✅ Withdrawals approve/reject karo

---

## 📱 Features

- 🔒 Channel Join Verification (one device per account)
- 💰 Referral Bonus System
- 🏆 Global Leaderboard
- 💸 Withdrawal with UPI
- ⚙️ Full Admin Panel
- 📊 Stats Dashboard
- 🎁 Join Bonus

---

## 🔧 Admin Credentials

- URL: `/admin`
- Secret: `earnultra_admin_2024`

**IMPORTANT: Production mein ADMIN_SECRET zaroor change karo!**
