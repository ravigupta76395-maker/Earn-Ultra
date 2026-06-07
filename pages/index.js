import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

const API = '';

// â”€â”€â”€ Utility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getDeviceId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('eu_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('eu_device_id', id);
  }
  return id;
}

// â”€â”€â”€ Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Icons = {
  home: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  ),
  trophy: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
    </svg>
  ),
  wallet: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
  ),
  chart: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zM16.2 13h2.8v6h-2.8v-6z"/>
    </svg>
  ),
  copy: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
    </svg>
  ),
  share: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
    </svg>
  ),
  check: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  ),
  people: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  ),
};

// â”€â”€â”€ Screens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LoadingScreen({ appName }) {
  return (
    <div style={styles.loadingWrap}>
      <div style={styles.loadingLogo}>
        <div style={styles.logoRing}>
          <div style={styles.logoInner}>ðŸ’°</div>
        </div>
      </div>
      <div style={styles.loadingName}>{appName || 'Earn Ultra'}</div>
      <div style={styles.loadingTagline}>REFER Â· EARN Â· WITHDRAW</div>
      <div style={styles.loadingBarWrap}>
        <div style={styles.loadingBar}></div>
      </div>
      <div style={styles.loadingTip}>ðŸ’¡ Invite friends to boost your earnings ðŸ‘¥</div>
    </div>
  );
}

function VerifyScreen({ settings, user, onVerified }) {
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState('');
  const channelUser = settings?.channelUsername || settings?.channelId || 'our_channel';

  const joinChannel = () => {
    const ch = channelUser.replace('@', '');
    window.open(`https://t.me/${ch}`, '_blank');
  };

  const verify = async () => {
    setChecking(true);
    setMsg('');
    try {
      const res = await fetch('/api/user/verify-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: user.telegramId,
          deviceId: getDeviceId(),
        }),
      });
      const data = await res.json();
      if (data.deviceBlocked) {
        setMsg('âš ï¸ This device is already registered with another account.');
      } else if (data.joined) {
        onVerified();
      } else {
        setMsg('âŒ You have not joined the channel yet. Please join first.');
      }
    } catch (e) {
      setMsg('Network error. Try again.');
    }
    setChecking(false);
  };

  return (
    <div style={styles.verifyWrap}>
      <div style={styles.verifyCard}>
        <div style={styles.verifyIcon}>ðŸ”’</div>
        <h2 style={styles.verifyTitle}>Secure Device Verification</h2>
        <p style={styles.verifyDesc}>
          Join our official channel to unlock your account and claim your free bonus!
        </p>
        <div style={styles.bonusBadge}>
          ðŸŽ Join Bonus: â‚¹{settings?.joinBonus || 5} FREE
        </div>
        <button style={styles.joinBtn} onClick={joinChannel}>
          ðŸ“¢ Join {channelUser.startsWith('@') ? channelUser : '@' + channelUser}
        </button>
        <button style={{ ...styles.verifyBtn, opacity: checking ? 0.7 : 1 }} onClick={verify} disabled={checking}>
          {checking ? 'âš¡ Verifying...' : 'âš¡ Verify & Continue'}
        </button>
        {msg && <p style={styles.verifyMsg}>{msg}</p>}
      </div>
    </div>
  );
}

function HomeTab({ user, settings, appUrl, onWithdraw, onRefresh }) {
  const [copied, setCopied] = useState(false);

  const referLink = `${appUrl || ''}?ref=${user?.referralCode}`;
  const tgLink = `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME || 'earnultrabot'}?startapp=${user?.referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(tgLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareLink = () => {
    const text = `ðŸš€ Join Earn Ultra & earn real cash!\nðŸ’° Use my invite link:\n${tgLink}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(tgLink)}&text=${encodeURIComponent('ðŸš€ Join Earn Ultra & earn real cash!')}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.tabContent}>
      {/* Balance Card */}
      <div style={styles.balanceCard}>
        <div style={styles.balanceLabel}>Total Balance</div>
        <div style={styles.balanceAmount}>â‚¹{(user?.balance || 0).toFixed(2)}</div>
        <div style={styles.balanceSubRow}>
          <span style={styles.balanceSub}>Total Earned: â‚¹{(user?.totalEarned || 0).toFixed(2)}</span>
          <span style={styles.balanceSub}>Referrals: {user?.referralCount || 0}</span>
        </div>
        <div style={styles.balanceDivider}></div>
        <div style={styles.balanceBonusRow}>
          <div style={styles.bonusItem}>
            <span style={styles.bonusAmt}>â‚¹{settings?.referralBonus || 10}</span>
            <span style={styles.bonusLbl}>Per Referral</span>
          </div>
          <div style={styles.bonusDivider}></div>
          <div style={styles.bonusItem}>
            <span style={styles.bonusAmt}>â‚¹{settings?.minWithdrawal || 100}</span>
            <span style={styles.bonusLbl}>Min Withdraw</span>
          </div>
        </div>
      </div>

      {/* Invite Link */}
      <div style={styles.sectionTitle}>ðŸ”— Your Invite Link</div>
      <div style={styles.inviteBox}>
        <div style={styles.inviteLink}>{tgLink.length > 40 ? tgLink.slice(0, 40) + '...' : tgLink}</div>
        <button style={styles.copyBtn} onClick={copyLink}>
          {copied ? <><Icons.check /> Copied!</> : <><Icons.copy /> Copy</>}
        </button>
      </div>

      {/* Action Buttons */}
      <div style={styles.actionRow}>
        <button style={styles.shareBtn} onClick={shareLink}>
          <Icons.share /> &nbsp;Share Link
        </button>
        <button style={styles.withdrawBtn} onClick={onWithdraw}>
          <Icons.wallet /> &nbsp;Withdraw
        </button>
      </div>

      {/* How it works */}
      <div style={styles.howCard}>
        <div style={styles.howTitle}>ðŸ’¡ How it Works</div>
        <div style={styles.howStep}><span style={styles.howNum}>1</span> Share your invite link with friends</div>
        <div style={styles.howStep}><span style={styles.howNum}>2</span> Friend joins & verifies channel</div>
        <div style={styles.howStep}><span style={styles.howNum}>3</span> You earn â‚¹{settings?.referralBonus || 10} instantly!</div>
        <div style={styles.howStep}><span style={styles.howNum}>4</span> Withdraw when you reach â‚¹{settings?.minWithdrawal || 100}</div>
      </div>
    </div>
  );
}

function LeaderboardTab({ user }) {
  const [tab, setTab] = useState('global');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/user/leaderboard?telegramId=${user?.telegramId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const medals = ['ðŸ¥‡', 'ðŸ¥ˆ', 'ðŸ¥‰'];

  return (
    <div style={styles.tabContent}>
      <div style={styles.lbHeader}>
        <div style={styles.lbTitle}>ðŸ† Leaderboard</div>
        <div style={styles.lbTabs}>
          <button
            style={{ ...styles.lbTab, ...(tab === 'global' ? styles.lbTabActive : {}) }}
            onClick={() => setTab('global')}
          >Global</button>
          <button
            style={{ ...styles.lbTab, ...(tab === 'my' ? styles.lbTabActive : {}) }}
            onClick={() => setTab('my')}
          >My Invites</button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingText}>Loading...</div>
      ) : tab === 'global' ? (
        <>
          {data?.myData && (
            <div style={styles.myRankCard}>
              <span>Your Rank</span>
              <span style={styles.myRankNum}>#{data.myData.rank}</span>
              <span>{data.myData.referralCount} referrals</span>
            </div>
          )}
          <div style={styles.lbList}>
            {(data?.leaderboard || []).length === 0 ? (
              <div style={styles.emptyText}>No referrals yet. Be the first! ðŸš€</div>
            ) : (
              (data?.leaderboard || []).map((item, i) => (
                <div
                  key={item.telegramId}
                  style={{
                    ...styles.lbItem,
                    ...(item.telegramId === user?.telegramId ? styles.lbItemMe : {}),
                  }}
                >
                  <span style={styles.lbRank}>{medals[i] || `#${item.rank}`}</span>
                  <span style={styles.lbName}>{item.name || 'User'}</span>
                  <span style={styles.lbCount}>{item.referralCount} ðŸ‘¥</span>
                  <span style={styles.lbEarned}>â‚¹{item.totalEarned}</span>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div style={styles.myInviteCard}>
          <div style={styles.myInviteStat}>
            <div style={styles.myInviteNum}>{user?.referralCount || 0}</div>
            <div style={styles.myInviteLabel}>Total Invites</div>
          </div>
          <div style={styles.myInviteStat}>
            <div style={styles.myInviteNum}>â‚¹{((user?.referralCount || 0) * 10).toFixed(0)}</div>
            <div style={styles.myInviteLabel}>Earned from Referrals</div>
          </div>
          <div style={styles.myRankCard}>
            <span>Your Global Rank</span>
            <span style={styles.myRankNum}>#{data?.myData?.rank || 'N/A'}</span>
          </div>
          <div style={styles.emptyText}>
            Keep inviting friends to climb the leaderboard! ðŸš€
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawTab({ user, settings, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [payInfo, setPayInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < (settings?.minWithdrawal || 100)) {
      setMsg(`Minimum withdrawal is â‚¹${settings?.minWithdrawal || 100}`);
      return;
    }
    if (!payInfo.trim()) {
      setMsg('Please enter your UPI ID / Phone number');
      return;
    }
    if (amt > (user?.balance || 0)) {
      setMsg('Insufficient balance');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: user?.telegramId,
          amount: amt,
          paymentInfo: payInfo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        onSuccess(data.newBalance);
      } else {
        setMsg(data.error || 'Failed. Try again.');
      }
    } catch (e) {
      setMsg('Network error. Try again.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={styles.tabContent}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>âœ…</div>
          <div style={styles.successTitle}>Request Submitted!</div>
          <div style={styles.successDesc}>Your withdrawal is being processed. You'll receive payment within 24 hours.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.tabContent}>
      <div style={styles.withdrawCard}>
        <div style={styles.wdTitle}>ðŸ’¸ Withdraw Earnings</div>
        <div style={styles.wdBalance}>Available: â‚¹{(user?.balance || 0).toFixed(2)}</div>
        <div style={styles.wdMin}>Minimum: â‚¹{settings?.minWithdrawal || 100}</div>

        <label style={styles.inputLabel}>Amount (â‚¹)</label>
        <input
          style={styles.input}
          type="number"
          placeholder={`Min â‚¹${settings?.minWithdrawal || 100}`}
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <label style={styles.inputLabel}>UPI ID / Phone Number</label>
        <input
          style={styles.input}
          type="text"
          placeholder="yourname@upi or 9999999999"
          value={payInfo}
          onChange={e => setPayInfo(e.target.value)}
        />

        {msg && <div style={styles.errorMsg}>{msg}</div>}

        <button
          style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? 'â³ Processing...' : 'ðŸ’¸ Submit Request'}
        </button>
      </div>
    </div>
  );
}

function StatsTab({ user, settings }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`/api/user/stats?telegramId=${user?.telegramId}`)
      .then(r => r.json())
      .then(d => setStats(d));
  }, [user]);

  return (
    <div style={styles.tabContent}>
      <div style={styles.statsTitle}>ðŸ“Š Statistics</div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNum}>â‚¹{(user?.balance || 0).toFixed(2)}</div>
          <div style={styles.statLabel}>Current Balance</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNum}>â‚¹{(user?.totalEarned || 0).toFixed(2)}</div>
          <div style={styles.statLabel}>Total Earned</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{user?.referralCount || 0}</div>
          <div style={styles.statLabel}>Total Referrals</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNum}>â‚¹{((user?.referralCount || 0) * (settings?.referralBonus || 10)).toFixed(2)}</div>
          <div style={styles.statLabel}>Referral Earnings</div>
        </div>
      </div>

      {stats && (
        <div style={styles.globalStats}>
          <div style={styles.globalTitle}>ðŸŒ Global Stats</div>
          <div style={styles.globalRow}>
            <span>Total Users</span>
            <span style={styles.globalVal}>{stats.totalUsers?.toLocaleString()}</span>
          </div>
          <div style={styles.globalRow}>
            <span>Total Paid Out</span>
            <span style={styles.globalVal}>â‚¹{(stats.totalPaid || 0).toFixed(2)}</span>
          </div>
          <div style={styles.globalRow}>
            <span>Referral Bonus</span>
            <span style={styles.globalVal}>â‚¹{settings?.referralBonus || 10}</span>
          </div>
          <div style={styles.globalRow}>
            <span>Min Withdrawal</span>
            <span style={styles.globalVal}>â‚¹{settings?.minWithdrawal || 100}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ Main App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function App() {
  const [phase, setPhase] = useState('loading'); // loading | verify | app
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [tab, setTab] = useState('home');
  const [tgUser, setTgUser] = useState(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [referCode, setReferCode] = useState('');

  useEffect(() => {
    // Parse ref from URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || urlParams.get('startapp') || '';
    if (ref) setReferCode(ref);

    // Init Telegram WebApp
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.setBackgroundColor('#0d1f0d');
      tg.setHeaderColor('#0d1f0d');
    }

    const tgData = tg?.initDataUnsafe?.user;
    if (tgData) {
      setTgUser(tgData);
    } else {
      // Dev fallback
      setTgUser({ id: 123456789, first_name: 'Test', username: 'testuser' });
    }
  }, []);

  useEffect(() => {
    if (!tgUser) return;

    const init = async () => {
      try {
        const res = await fetch('/api/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: String(tgUser.id),
            username: tgUser.username || '',
            firstName: tgUser.first_name || '',
            lastName: tgUser.last_name || '',
            referCode,
            deviceId: getDeviceId(),
          }),
        });
        const data = await res.json();
        setUser(data.user);
        setSettings(data.settings || {});

        // Decide phase
        if (data.user.channelJoined) {
          setPhase('app');
        } else {
          setTimeout(() => setPhase('verify'), 2500);
        }
      } catch (e) {
        setTimeout(() => setPhase('verify'), 2500);
      }
    };

    init();
  }, [tgUser, referCode]);

  const handleVerified = useCallback(async () => {
    // Refresh user
    const res = await fetch('/api/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: String(tgUser.id),
        
