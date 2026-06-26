'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import {
  Bell, BellOff, Check, CheckCheck, Globe, Tv, Shield,
  AlertTriangle, RefreshCw, Zap, Info, X,
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const load = async () => {
    try {
      const params: Record<string, string> = { limit: '50' };
      if (filter === 'unread') params.read = 'false';
      if (filter === 'read') params.read = 'true';
      const res: any = await api.notifications.list(params);
      if (res.success) setNotifications(res.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const markRead = async (id: string) => {
    await api.notifications.markRead(id);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await api.notifications.markAllRead();
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    const icons: Record<string, typeof Bell> = {
      OAUTH_EXPIRED: AlertTriangle, OAUTH_REFRESHED: RefreshCw,
      SYNC_COMPLETE: Check, SYNC_FAILED: X,
      OPERATION_COMPLETE: Zap, OPERATION_FAILED: AlertTriangle,
      ACCOUNT_CONNECTED: Globe, ACCOUNT_DISCONNECTED: BellOff,
      SYSTEM: Info,
    };
    return icons[type] || Bell;
  };

  const getIconColor = (type: string) => {
    if (type.includes('FAILED') || type.includes('EXPIRED') || type.includes('DISCONNECTED')) return 'text-[var(--color-accent-red)]';
    if (type.includes('COMPLETE') || type.includes('CONNECTED') || type.includes('REFRESHED')) return 'text-[var(--color-success)]';
    return 'text-[var(--color-accent-blue)]';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm flex items-center gap-2">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(['all', 'unread', 'read'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] border border-[var(--color-accent-blue)]/30'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] border border-transparent'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="glass-card h-20 shimmer" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bell className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-[var(--color-text-secondary)] text-sm">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {notifications.map((n) => {
            const Icon = getIcon(n.type);
            return (
              <div
                key={n.id}
                className={`glass-card p-4 flex items-start gap-4 cursor-pointer transition-all hover:border-[var(--color-border-active)] ${
                  !n.read ? 'border-l-4 border-l-[var(--color-accent-blue)]' : 'opacity-70'
                }`}
                onClick={() => !n.read && markRead(n.id)}
              >
                <div className={`w-9 h-9 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${getIconColor(n.type)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent-blue)] flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
