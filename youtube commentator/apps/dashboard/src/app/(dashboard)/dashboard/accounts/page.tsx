'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { timeAgo, getStatusColor } from '@/lib/utils';
import { Plus, RefreshCw, Trash2, Mail, Loader2, Wifi, WifiOff, ExternalLink } from 'lucide-react';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [mockName, setMockName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const loadAccounts = async () => {
    try {
      const res: any = await api.accounts.list();
      if (res.success) setAccounts(res.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadAccounts(); }, []);

  const addMockAccount = async () => {
    if (!mockName.trim()) return;
    setAdding(true);
    try {
      await api.accounts.addMock(mockName);
      setMockName('');
      setShowAddModal(false);
      await loadAccounts();
    } catch {} finally { setAdding(false); }
  };

  const syncAccount = async (id: string) => {
    await api.accounts.sync(id);
    await loadAccounts();
  };

  const deleteAccount = async (id: string) => {
    await api.accounts.delete(id);
    await loadAccounts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Google Accounts</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Manage your connected Google accounts</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Connect Account
        </button>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-card h-52 shimmer" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-[var(--color-border-primary)] flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-[var(--color-accent-blue)]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-sm mx-auto">
            Connect your Google accounts to start managing YouTube channels across all of them.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Connect Your First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {accounts.map((account) => (
            <div key={account.id} className="glass-card p-5 group hover:border-[var(--color-border-active)] transition-all">
              <div className="flex items-start gap-4">
                <img
                  src={account.profilePicture || `https://ui-avatars.com/api/?name=${account.displayName}&background=3b82f6&color=fff`}
                  alt={account.displayName}
                  className="w-12 h-12 rounded-xl object-cover border border-[var(--color-border-primary)]"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{account.displayName}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] truncate">{account.email}</p>
                </div>
                <span className={`badge ${getStatusColor(account.status)}`}>{account.status}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-[var(--color-bg-input)] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold">{account.channelCount}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Channels</p>
                </div>
                <div className="bg-[var(--color-bg-input)] rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-[var(--color-success)]">
                    {account.status === 'ACTIVE' ? <Wifi className="w-5 h-5 mx-auto" /> : <WifiOff className="w-5 h-5 mx-auto text-[var(--color-error)]" />}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">OAuth</p>
                </div>
              </div>

              <p className="text-xs text-[var(--color-text-muted)] mt-3">
                Connected {timeAgo(account.connectedAt)}
                {account.lastSyncedAt && ` • Synced ${timeAgo(account.lastSyncedAt)}`}
              </p>

              {/* Actions */}
              <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => syncAccount(account.id)} className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Sync
                </button>
                <button onClick={() => deleteAccount(account.id)} className="btn-ghost flex-1 text-xs flex items-center justify-center gap-1 text-[var(--color-accent-red)] hover:bg-red-500/10">
                  <Trash2 className="w-3 h-3" /> Disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="glass-card p-8 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Connect Google Account</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Add a mock account for development. In production, this connects via Google OAuth.
            </p>
            <input
              type="text"
              value={mockName}
              onChange={(e) => setMockName(e.target.value)}
              className="input-field mb-4"
              placeholder="Account display name (e.g., John's Studio)"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addMockAccount()}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={addMockAccount} disabled={adding || !mockName.trim()} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
