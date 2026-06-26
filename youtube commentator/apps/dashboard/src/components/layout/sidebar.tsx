'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Tv, FolderKanban, Briefcase,
  Activity, Bell, BarChart3, Settings, Youtube,
  ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/accounts', icon: Users, label: 'Google Accounts' },
  { href: '/dashboard/channels', icon: Tv, label: 'Channels' },
  { href: '/dashboard/groups', icon: FolderKanban, label: 'Groups' },
  { href: '/dashboard/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();
  const { user, logout } = useAuthStore();

  return (
    <aside
      className={cn(
        'h-screen flex flex-col border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] transition-all duration-300 ease-in-out relative',
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-[var(--color-border-primary)]', isCollapsed && 'justify-center')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent-blue)] to-[var(--color-accent-purple)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/10">
          <Youtube className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold gradient-text leading-tight">YTManager</h1>
            <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">Multi-Channel Platform</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 z-50 w-6 h-6 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all shadow-md"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]',
                isCollapsed && 'justify-center px-2'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-accent-blue)]" />
              )}
              <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-[var(--color-accent-blue)]')} />
              {!isCollapsed && <span className="animate-fade-in">{item.label}</span>}

              {/* Tooltip for collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-primary)] text-xs text-[var(--color-text-primary)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className={cn('p-3 border-t border-[var(--color-border-primary)]', isCollapsed && 'flex justify-center')}>
        {isCollapsed ? (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent-emerald)] to-[var(--color-accent-cyan)] flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent-emerald)] to-[var(--color-accent-cyan)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={logout}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-red)] transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
