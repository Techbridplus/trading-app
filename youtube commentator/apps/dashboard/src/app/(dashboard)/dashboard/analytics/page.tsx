'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import {
  BarChart3, TrendingUp, Clock, Shield, Activity,
  Users, Tv, Zap, AlertTriangle, CheckCircle,
} from 'lucide-react';

// Simple chart components (no external library needed for basic charts)
function BarChartSimple({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  const max = Math.max(...data.map(d => d[dataKey] || 0), 1);
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md transition-all duration-500 hover:opacity-80" style={{
            height: `${Math.max((d[dataKey] / max) * 100, 4)}%`,
            background: `linear-gradient(to top, ${color}40, ${color})`,
          }} />
          <span className="text-[9px] text-[var(--color-text-muted)] truncate w-full text-center">
            {d.date?.slice(5) || d.range || d.status || d.account?.split('@')[0] || ''}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let cumulative = 0;
  const segments = data.map(d => {
    const start = cumulative;
    cumulative += (d.value / total) * 360;
    return { ...d, start, end: cumulative };
  });

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        {segments.map((s, i) => {
          const percentage = s.value / total;
          const dashArray = `${percentage * 100} ${100 - percentage * 100}`;
          const dashOffset = -(segments.slice(0, i).reduce((sum, prev) => sum + (prev.value / total) * 100, 0));
          return (
            <circle key={i} cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
              stroke={s.color} strokeDasharray={dashArray} strokeDashoffset={dashOffset}
              className="transition-all duration-500" />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold">{total}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">Total</p>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res: any = await api.analytics.dashboard();
        if (res.success) {
          setStats(res.data.stats);
          setData(res.data.analytics);
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="glass-card h-28 shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="glass-card h-64 shimmer" />)}
        </div>
      </div>
    );
  }

  const healthMetrics = [
    {
      label: 'OAuth Health',
      value: `${data?.oauthHealthScore || 100}%`,
      icon: Shield,
      color: (data?.oauthHealthScore || 100) > 80 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]',
      bg: (data?.oauthHealthScore || 100) > 80 ? 'from-emerald-500/10 to-emerald-500/5' : 'from-amber-500/10 to-amber-500/5',
    },
    {
      label: 'Avg Execution',
      value: `${data?.avgExecutionTime || 0}ms`,
      icon: Clock,
      color: 'text-[var(--color-accent-blue)]',
      bg: 'from-blue-500/10 to-blue-500/5',
    },
    {
      label: 'Queue Depth',
      value: data?.queueDepth || 0,
      icon: Activity,
      color: 'text-[var(--color-accent-purple)]',
      bg: 'from-purple-500/10 to-purple-500/5',
    },
    {
      label: 'Recent Ops',
      value: data?.recentOperationRate || 0,
      icon: Zap,
      color: 'text-[var(--color-accent-amber)]',
      bg: 'from-amber-500/10 to-amber-500/5',
    },
  ];

  const jobColors: Record<string, string> = {
    COMPLETED: '#10b981', FAILED: '#ef4444', RUNNING: '#3b82f6',
    PENDING: '#8b5cf6', QUEUED: '#06b6d4', RETRYING: '#f59e0b', CANCELLED: '#6b7280',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Platform performance and operational insights</p>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {healthMetrics.map((m) => (
          <div key={m.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.bg} flex items-center justify-center`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">{m.label}</p>
                <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operations Over Time */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--color-accent-blue)]" />
            Operations Over Time
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Last 7 days</p>
          {data?.operationsOverTime?.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--color-success)]" /> Completed</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--color-error)]" /> Failed</span>
              </div>
              <BarChartSimple data={data.operationsOverTime} dataKey="completed" color="#10b981" />
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data yet</div>
          )}
        </div>

        {/* Job Status Breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--color-accent-purple)]" />
            Job Status Breakdown
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">All time distribution</p>
          {data?.jobStatusBreakdown?.length > 0 ? (
            <div className="flex items-center gap-6">
              <DonutChart
                data={data.jobStatusBreakdown.map((d: any) => ({
                  label: d.status, value: d.count,
                  color: jobColors[d.status] || '#6b7280',
                }))}
              />
              <div className="flex-1 space-y-2">
                {data.jobStatusBreakdown.map((d: any) => (
                  <div key={d.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: jobColors[d.status] || '#6b7280' }} />
                      <span className="text-[var(--color-text-secondary)]">{d.status}</span>
                    </div>
                    <span className="font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data yet</div>
          )}
        </div>

        {/* Channels by Account */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--color-accent-emerald)]" />
            Channels by Account
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Distribution across Google accounts</p>
          {data?.channelsByAccount?.length > 0 ? (
            <BarChartSimple data={data.channelsByAccount} dataKey="count" color="#8b5cf6" />
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data yet</div>
          )}
        </div>

        {/* Subscriber Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Tv className="w-4 h-4 text-[var(--color-accent-pink)]" />
            Subscriber Distribution
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Channels by subscriber count range</p>
          {data?.subscriberDistribution?.length > 0 ? (
            <BarChartSimple data={data.subscriberDistribution} dataKey="count" color="#ec4899" />
          ) : (
            <div className="h-32 flex items-center justify-center text-sm text-[var(--color-text-muted)]">No data yet</div>
          )}
        </div>
      </div>

      {/* Summary Stats Row */}
      {stats && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-4">Platform Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: 'Accounts', value: stats.totalAccounts, icon: Users },
              { label: 'Active', value: stats.activeAccounts, icon: CheckCircle },
              { label: 'Channels', value: stats.totalChannels, icon: Tv },
              { label: 'Subscribers', value: formatNumber(stats.totalSubscribers), icon: TrendingUp },
              { label: 'Active Jobs', value: stats.activeJobs, icon: Activity },
              { label: 'Failed', value: stats.failedJobs, icon: AlertTriangle },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-xl bg-[var(--color-bg-input)]">
                <s.icon className="w-4 h-4 mx-auto text-[var(--color-text-muted)] mb-1" />
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
