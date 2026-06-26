'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatNumber, timeAgo, getStatusColor } from '@/lib/utils';
import {
  Users, Tv, Eye, Video, TrendingUp, AlertTriangle,
  Bell, Briefcase, RefreshCw, ArrowUpRight, Zap,
  Globe, Heart, Clock,
} from 'lucide-react';

interface StatsData {
  totalAccounts: number;
  activeAccounts: number;
  totalChannels: number;
  totalSubscribers: number;
  totalVideos: number;
  totalViews: number;
  activeJobs: number;
  failedJobs: number;
  unreadNotifications: number;
}

const statConfig = [
  { key: 'totalAccounts', label: 'Google Accounts', icon: Users, color: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/20' },
  { key: 'totalChannels', label: 'YouTube Channels', icon: Tv, color: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/20' },
  { key: 'totalSubscribers', label: 'Total Subscribers', icon: TrendingUp, color: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/20' },
  { key: 'totalVideos', label: 'Total Videos', icon: Video, color: 'from-amber-500 to-amber-600', glow: 'shadow-amber-500/20' },
  { key: 'totalViews', label: 'Total Views', icon: Eye, color: 'from-pink-500 to-pink-600', glow: 'shadow-pink-500/20' },
  { key: 'activeJobs', label: 'Active Jobs', icon: Briefcase, color: 'from-cyan-500 to-cyan-600', glow: 'shadow-cyan-500/20' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [analyticsRes, activityRes]: any[] = await Promise.all([
          api.analytics.dashboard(),
          api.analytics.activity({ limit: '8' }),
        ]);
        if (analyticsRes.success) setStats(analyticsRes.data.stats);
        if (activityRes.success) setActivity(activityRes.data);
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="stat-card h-32 shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Overview of your YouTube management platform</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" />
          Sync All
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {statConfig.map((stat) => {
          const value = stats?.[stat.key as keyof StatsData] || 0;
          return (
            <div key={stat.key} className="stat-card group cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold tracking-tight">{formatNumber(value as number)}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.glow} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <ArrowUpRight className="w-3 h-3 text-[var(--color-success)]" />
                <span className="text-[var(--color-success)]">+12%</span>
                <span>from last week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--color-accent-amber)]" />
            Quick Actions
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Connect Google Account', icon: Users, color: 'text-blue-400', href: '/dashboard/accounts' },
              { label: 'Browse Channels', icon: Tv, color: 'text-purple-400', href: '/dashboard/channels' },
              { label: 'Create Group', icon: Globe, color: 'text-emerald-400', href: '/dashboard/groups' },
              { label: 'View Analytics', icon: TrendingUp, color: 'text-pink-400', href: '/dashboard/analytics' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-all group"
              >
                <action.icon className={`w-4 h-4 ${action.color}`} />
                <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">{action.label}</span>
                <ArrowUpRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] transition-opacity" />
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--color-accent-blue)]" />
            Recent Activity
          </h3>
          {activity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-[var(--color-text-secondary)] text-sm">No recent activity</p>
              <p className="text-[var(--color-text-muted)] text-xs mt-1">Connect a Google account to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-bg-elevated)]/50 transition-all">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    log.status === 'success' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{log.entityType} • {timeAgo(log.createdAt)}</p>
                  </div>
                  <span className={`badge ${getStatusColor(log.status.toUpperCase())}`}>{log.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {stats && stats.failedJobs > 0 && (
        <div className="glass-card p-4 border-l-4 border-l-[var(--color-accent-amber)] animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--color-accent-amber)]" />
            <div>
              <p className="text-sm font-medium">Attention Required</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{stats.failedJobs} failed job(s) need your attention</p>
            </div>
            <a href="/dashboard/jobs" className="ml-auto btn-ghost text-xs">View Jobs →</a>
          </div>
        </div>
      )}
    </div>
  );
}

function Activity({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>;
}
