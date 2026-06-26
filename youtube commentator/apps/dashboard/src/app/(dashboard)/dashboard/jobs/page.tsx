'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getStatusColor, timeAgo } from '@/lib/utils';
import { Briefcase, Clock, CheckCircle, XCircle, Loader2, RefreshCw, Timer, Zap } from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = async () => {
    try {
      const params: Record<string, string> = { limit: '30' };
      if (filter) params.status = filter;
      const res: any = await api.jobs.list(params);
      if (res.success) setJobs(res.data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filter]);

  const getJobIcon = (type: string) => {
    const icons: Record<string, typeof Briefcase> = {
      CHANNEL_SYNC: RefreshCw, BULK_OPERATION: Zap, TOKEN_REFRESH: Timer,
      ANALYTICS_UPDATE: Loader2, NOTIFICATION_SEND: CheckCircle, DATA_CLEANUP: XCircle,
    };
    return icons[type] || Briefcase;
  };

  const statusFilters = ['', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Monitor background operations and sync tasks</p>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(s => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === s
                ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)] border border-[var(--color-accent-blue)]/30'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] border border-transparent'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="glass-card h-20 shimmer" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Briefcase className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
          <p className="text-[var(--color-text-secondary)] text-sm">Jobs appear here when you sync accounts or run operations.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {jobs.map((job) => {
            const Icon = getJobIcon(job.type);
            return (
              <div key={job.id} className="glass-card p-4 flex items-center gap-4 hover:border-[var(--color-border-active)] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[var(--color-accent-blue)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium">{job.type.replace(/_/g, ' ')}</p>
                    {job.channelTitle && <span className="text-xs text-[var(--color-text-muted)]">• {job.channelTitle}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(job.createdAt)}</span>
                    {job.executionTime && <span>{job.executionTime}ms</span>}
                    <span>Attempt {job.attempts}/{job.maxAttempts}</span>
                  </div>
                </div>
                {/* Progress */}
                {job.status === 'RUNNING' && (
                  <div className="w-24">
                    <div className="h-1.5 bg-[var(--color-bg-input)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-accent-blue)] rounded-full transition-all animate-pulse" style={{ width: `${job.progress}%` }} />
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] text-right mt-0.5">{job.progress}%</p>
                  </div>
                )}
                <span className={`badge ${getStatusColor(job.status)}`}>{job.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
