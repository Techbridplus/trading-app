'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { timeAgo, getStatusColor } from '@/lib/utils';
import { Activity, Clock, User, Globe, Tv, Shield, ChevronDown } from 'lucide-react';

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (append = false) => {
    try {
      const res: any = await api.analytics.activity({ page: page.toString(), limit: '20' });
      if (res.success) {
        setLogs(prev => append ? [...prev, ...res.data] : res.data);
        setHasMore(res.pagination.page < res.pagination.totalPages);
      }
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(page > 1); }, [page]);

  const getEntityIcon = (type: string) => {
    const icons: Record<string, typeof Activity> = {
      User: User, GoogleAccount: Globe, Channel: Tv, Session: Shield,
    };
    return icons[type] || Activity;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Complete audit trail of all actions</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-16 shimmer rounded-xl" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Activity className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
          <p className="text-[var(--color-text-secondary)] text-sm">Your actions will appear here as you use the platform.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--color-border-primary)]" />

          <div className="space-y-4 stagger-children">
            {logs.map((log) => {
              const Icon = getEntityIcon(log.entityType);
              return (
                <div key={log.id} className="relative flex items-start gap-4 pl-12">
                  {/* Timeline dot */}
                  <div className={`absolute left-3.5 top-3 w-3 h-3 rounded-full border-2 border-[var(--color-bg-primary)] ${
                    log.status === 'success' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'
                  }`} />

                  <div className="glass-card p-4 flex-1 hover:border-[var(--color-border-active)] transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-[var(--color-accent-blue)]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</p>
                          <span className={`badge text-[10px] ${getStatusColor(log.status.toUpperCase())}`}>{log.status}</span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {log.entityType}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}
                          {log.executionTimeMs ? ` • ${log.executionTimeMs}ms` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />{timeAgo(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="text-center mt-6 pl-12">
              <button onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm flex items-center gap-2 mx-auto">
                <ChevronDown className="w-4 h-4" /> Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
