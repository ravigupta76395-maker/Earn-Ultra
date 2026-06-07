import { useState, useEffect } from 'react';
import Head from 'next/head';

const ADMIN_SECRET = 'earnultra_admin_2024';

const G = '#22c55e';
const BG = '#0a0a0a';
const CARD = '#111';
const CARD2 = '#1a1a1a';
const BORDER = '#2a2a2a';
const TEXT = '#f0f0f0';
const MUTED = '#666';
const RED = '#ef4444';

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [secret, setSecret] = useState('');
  const [tab, setTab] = useState('settings');
  const [settings, setSettings] = useState({});
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const login = () => {
    if (secret === ADMIN_SECRET) setAuth(true);
    else setMsg('Wrong password');
  };

  useEffect(() => {
    if (!auth) return;
    fetchSettings();
    fetchUsers();
    fetchWithdrawals();
  }, [auth]);

  const fetchSettings = async () => {
    const res = await fetch('/api/admin/settings', { headers: { 'x-admin-secret': ADMIN_SECRET } });
    const data = await res.json();
    setSettings(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', { headers: { 'x-admin-secret': ADMIN_SECRET } });
    const data = await res.json();
    setUsers(data.users || []);
  };

  const fetchWithdrawals = async () => {
    const res = await fetch('/api/admin/withdrawals?status=pending', { headers: { 'x-admin-secret': ADMIN_SECRET } });
    const data = await res.json();
    setWithdrawals(Array.isArray(data) ? data : []);
  };

  const saveSettings = async () => {
    setLoading(true);
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify(settings),
    });
    setMsg('âœ… Settings saved!');
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const approveWithdrawal = async (telegramId, withdrawalId) => {
    await fetch('/api/admin/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ telegramId, withdrawalId, status: 'approved' }),
    });
    fetchWithdrawals();
  };

  const rejectWithdrawal = async (telegramId, withdrawalId) => {
    await fetch('/api/admin/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ telegramId, withdrawalId, status: 'rejected' }),
    });
    fetchWithdrawals();
  };

  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Head><title>Admin â€“ Earn Ultra</title></Head>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 32, width: '100%', maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>ðŸ”</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 20 }}>Admin Login</div>
          <input
            type="password"
            placeholder="Admin Secret"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontSize: 15, outline: 'none', marginBottom: 12 }}
          />
          {msg && <div style={{ color: RED, fontSize: 13, marginBottom: 10 }}>{msg}</div>}
          <button
            onClick={login}
            style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: G, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'sans-serif' }}>
      <Head><title>Admin â€“ Earn Ultra</title></Head>
      <style>{`* { box-sizing: border-box; } input, select { color-scheme: dark; }`}</style>

      {/* Topbar */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: G }}>âš™ï¸ Earn Ultra Admin</div>
        <div style={{ fontSize: 13, color: MUTED }}>{users.length} users Â· {withdrawals.length} pending</div>
      </div>

      {/* Tabs */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', padding: '0 20px', gap: 0 }}>
        {['settings', 'users', 'withdrawals'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '12px 20px', border: 'none', borderBottom: tab === t ? `2px solid ${G}` : '2px solid transparent',
              background: 'none', color: tab === t ? G : MUTED, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >{t}</button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        {/* Settings */}
        {tab === 'settings' && (
          <div>
            <h2 style={{ marginBottom: 20, color: TEXT }}>App Settings</h2>
            {msg && <div style={{ background: '#1a2e1a', border: `1px solid ${G}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: G, fontSize: 14 }}>{msg}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {[
                { key: 'appName', label: 'App Name', type: 'text' },
                { key: 'channelUsername', label: 'Channel Username (e.g. @mychannel)', type: 'text' },
                { key: 'channelId', label: 'Channel ID (e.g. -1001234567890)', type: 'text' },
                { key: 'referralBonus', label: 'Referral Bonus (â‚¹)', type: 'number' },
                { key: 'joinBonus', label: 'Join Bonus (â‚¹)', type: 'number' },
                { key: 'minWithdrawal', label: 'Min Withdrawal (â‚¹)', type: 'number' },
                { key: 'paymentApiUrl', label: 'Payment API URL', type: 'text' },
                { key: 'paymentApiKey', label: 'Payment API Key', type: 'text' },
              ].map(field => (
                <div key={field.key} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: MUTED, marginBottom: 8, letterSpacing: 1 }}>{field.label.toUpperCase()}</label>
                  <input
                    type={field.type}
                    value={settings[field.key] || ''}
                    onChange={e => setSettings(prev => ({ ...prev, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontSize: 14, outline: 'none' }}
                  />
                </div>
              ))}
              {/* Withdrawal Toggle */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: MUTED, marginBottom: 8, letterSpacing: 1 }}>WITHDRAWALS ENABLED</label>
                <select
                  value={settings.withdrawalEnabled ? 'true' : 'false'}
                  onChange={e => setSettings(prev => ({ ...prev, withdrawalEnabled: e.target.value === 'true' }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: CARD2, color: TEXT, fontSize: 14, outline: 'none' }}
                >
                  <option value="true">âœ… Enabled</option>
                  <option value="false">âŒ Disabled</option>
                </select>
              </div>
            </div>
            <button
              onClick={saveSettings}
              disabled={loading}
              style={{ marginTop: 20, padding: '14px 32px', borderRadius: 10, border: 'none', background: G, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Saving...' : 'ðŸ’¾ Save Settings'}
            </button>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <h2 style={{ marginBottom: 16, color: TEXT }}>All Users ({users.length})</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: CARD, color: MUTED }}>
                    {['Telegram ID', 'Name', 'Balance', 'Earned', 'Referrals', 'Verified', 'Joined'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.telegramId} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '10px 12px', color: MUTED }}>{u.telegramId}</td>
                      <td style={{ padding: '10px 12px' }}>{u.firstName || u.username || 'User'}</td>
                      <td style={{ padding: '10px 12px', color: G, fontWeight: 700 }}>â‚¹{u.balance?.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px' }}>â‚¹{u.totalEarned?.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px' }}>{u.referralCount}</td>
                      <td style={{ padding: '10px 12px' }}>{u.isVerified ? 'âœ…' : 'âŒ'}</td>
                      <td style={{ padding: '10px 12px', color: MUTED }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Withdrawals */}
        {tab === 'withdrawals' && (
          <div>
            <h2 style={{ marginBottom: 16, color: TEXT }}>Pending Withdrawals ({withdrawals.length})</h2>
            {withdrawals.length === 0 ? (
              <div style={{ color: MUTED, textAlign: 'center', padding: 40 }}>No pending withdrawals ðŸŽ‰</div>
            ) : (
              withdrawals.map(w => (
                <div key={w._id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{w.firstName || w.username || 'User'}</div>
                      <div style={{ color: MUTED, fontSize: 12 }}>@{w.username || w.telegramId}</div>
                      <div style={{ color: G, fontSize: 18, fontWeight: 700, marginTop: 4 }}>â‚¹{w.amount}</div>
                      <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>UPI: {w.paymentInfo}</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{new Date(w.createdAt).toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => approveWithdrawal(w.telegramId, w._id)}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: G, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >âœ… Approve</button>
                      <button
                        onClick={() => rejectWithdrawal(w.telegramId, w._id)}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: RED, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >âŒ Reject</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
                }
