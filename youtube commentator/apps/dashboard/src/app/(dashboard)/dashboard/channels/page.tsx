'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatNumber, getStatusColor } from '@/lib/utils';
import {
  Search, Filter, Grid3X3, List, Star, Heart, MoreVertical,
  Eye, Video, Users as UsersIcon, Globe, Tag, ChevronLeft,
  ChevronRight, Loader2, X, SlidersHorizontal,
} from 'lucide-react';

export default function ChannelsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({ status: '', sortBy: 'title', sortOrder: 'asc' });

  const loadChannels = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(), limit: '12',
        sortBy: filters.sortBy, sortOrder: filters.sortOrder,
      };
      if (search) params.search = search;
      if (filters.status) params.status = filters.status;
      const res: any = await api.channels.list(params);
      if (res.success) {
        setChannels(res.data);
        setPagination(res.pagination);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadChannels(); }, [page, search, filters]);

  const toggleFavorite = async (id: string, current: boolean) => {
    await api.channels.update(id, { isFavorite: !current });
    setChannels(chs => chs.map(ch => ch.id === id ? { ...ch, isFavorite: !current } : ch));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === channels.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(channels.map(ch => ch.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Channels</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{pagination.total} channels across all accounts</p>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
            placeholder="Search by name, handle, ID..."
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
          className="input-field w-auto min-w-[140px] cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SYNCING">Syncing</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        {/* Sort */}
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            setFilters(f => ({ ...f, sortBy, sortOrder }));
          }}
          className="input-field w-auto min-w-[160px] cursor-pointer"
        >
          <option value="title-asc">Name (A-Z)</option>
          <option value="title-desc">Name (Z-A)</option>
          <option value="subscriberCount-desc">Subscribers ↓</option>
          <option value="subscriberCount-asc">Subscribers ↑</option>
          <option value="videoCount-desc">Videos ↓</option>
          <option value="createdAt-desc">Newest First</option>
        </select>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-[var(--color-border-primary)] overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`p-2 transition-colors ${view === 'grid' ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)]'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-2 transition-colors ${view === 'table' ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)]'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="glass-card p-3 flex items-center gap-4 animate-fade-in border-l-4 border-l-[var(--color-accent-blue)]">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <button className="btn-ghost text-xs" onClick={() => setSelectedIds(new Set())}>Clear</button>
          <button className="btn-ghost text-xs text-[var(--color-accent-amber)]">
            <Heart className="w-3 h-3 mr-1 inline" />Favorite
          </button>
          <button className="btn-ghost text-xs text-[var(--color-accent-purple)]">
            <Tag className="w-3 h-3 mr-1 inline" />Tag
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`shimmer rounded-xl ${view === 'grid' ? 'h-72' : 'h-16'}`} />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Search className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No channels found</h3>
          <p className="text-[var(--color-text-secondary)] text-sm">
            {search ? 'Try adjusting your search or filters' : 'Connect a Google account to discover channels'}
          </p>
        </div>
      ) : view === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className={`glass-card overflow-hidden group cursor-pointer transition-all ${
                selectedIds.has(ch.id) ? 'ring-2 ring-[var(--color-accent-blue)] border-transparent' : ''
              }`}
              onClick={() => toggleSelect(ch.id)}
            >
              {/* Thumbnail Header */}
              <div className="relative h-20 bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-card)] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-card)] to-transparent z-10" />
                <img
                  src={ch.thumbnailUrl}
                  alt={ch.title}
                  className="w-14 h-14 rounded-xl object-cover border-2 border-[var(--color-bg-card)] relative z-20 shadow-lg"
                />
                {/* Favorite */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(ch.id, ch.isFavorite); }}
                  className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
                >
                  <Star className={`w-4 h-4 ${ch.isFavorite ? 'fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]' : 'text-white/70'}`} />
                </button>
                {/* Status */}
                <div className="absolute top-2 left-2 z-20">
                  <span className={`badge text-[10px] ${getStatusColor(ch.status)}`}>{ch.status}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold truncate mb-0.5">{ch.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{ch.handle || ch.youtubeId}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center">
                    <p className="text-sm font-bold">{formatNumber(ch.subscriberCount)}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">Subs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">{formatNumber(ch.videoCount)}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">Videos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">{formatNumber(ch.viewCount)}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">Views</p>
                  </div>
                </div>

                {/* Tags */}
                {ch.tags?.length > 0 && (
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {ch.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-[var(--color-accent-purple)]/10 text-[var(--color-accent-purple)] text-[10px] font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Account */}
                <div className="mt-3 pt-3 border-t border-[var(--color-border-secondary)] flex items-center gap-2">
                  <Globe className="w-3 h-3 text-[var(--color-text-muted)]" />
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{ch.googleAccountEmail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border-primary)]">
                <th className="text-left p-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  <input type="checkbox" onChange={selectAll} checked={selectedIds.size === channels.length && channels.length > 0} className="accent-[var(--color-accent-blue)]" />
                </th>
                <th className="text-left p-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Channel</th>
                <th className="text-left p-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Subscribers</th>
                <th className="text-left p-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Videos</th>
                <th className="text-left p-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Views</th>
                <th className="text-left p-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Account</th>
                <th className="text-left p-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch) => (
                <tr key={ch.id} className="border-b border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-elevated)]/30 transition-colors">
                  <td className="p-4">
                    <input type="checkbox" checked={selectedIds.has(ch.id)} onChange={() => toggleSelect(ch.id)} className="accent-[var(--color-accent-blue)]" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={ch.thumbnailUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
                      <div>
                        <p className="text-sm font-medium truncate max-w-[180px]">{ch.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{ch.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium">{formatNumber(ch.subscriberCount)}</td>
                  <td className="p-4 text-sm text-[var(--color-text-secondary)]">{formatNumber(ch.videoCount)}</td>
                  <td className="p-4 text-sm text-[var(--color-text-secondary)]">{formatNumber(ch.viewCount)}</td>
                  <td className="p-4 text-xs text-[var(--color-text-muted)] truncate max-w-[150px]">{ch.googleAccountEmail}</td>
                  <td className="p-4"><span className={`badge ${getStatusColor(ch.status)}`}>{ch.status}</span></td>
                  <td className="p-4">
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(ch.id, ch.isFavorite); }} className="p-1 rounded hover:bg-[var(--color-bg-elevated)] transition-colors">
                      <Star className={`w-4 h-4 ${ch.isFavorite ? 'fill-[var(--color-accent-amber)] text-[var(--color-accent-amber)]' : 'text-[var(--color-text-muted)]'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">
            Page {page} of {pagination.totalPages} • {pagination.total} total
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-sm disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === p ? 'bg-[var(--color-accent-blue)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]'
                }`}
              >
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="btn-ghost text-sm disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
