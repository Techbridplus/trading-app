'use client';

import { useEffect, useState } from 'react';
import { Search, Bell, Command } from 'lucide-react';
import { useSearchStore, useAuthStore } from '@/lib/store';

export default function Topbar() {
  const { open } = useSearchStore();
  const user = useAuthStore((s) => s.user);
  const [unread, setUnread] = useState(3);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <header className="h-16 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl flex items-center justify-between px-6">
      {/* Search */}
      <button
        onClick={open}
        className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] text-[var(--color-text-muted)] hover:border-[var(--color-border-active)] hover:text-[var(--color-text-secondary)] transition-all w-[320px] group"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm">Search channels, accounts...</span>
        <div className="ml-auto flex items-center gap-1 text-[10px] opacity-60 group-hover:opacity-100 transition-opacity">
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] font-mono">
            <Command className="w-2.5 h-2.5 inline" />
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] font-mono">K</kbd>
        </div>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] transition-all">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--color-accent-red)] text-white text-[10px] font-bold flex items-center justify-center animate-pulse-glow">
              {unread}
            </span>
          )}
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3 pl-3 border-l border-[var(--color-border-primary)]">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{user?.role || 'User'}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent-emerald)] to-[var(--color-accent-cyan)] flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
