import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateStr);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'badge-success', COMPLETED: 'badge-success', SUCCESS: 'badge-success',
    EXPIRED: 'badge-warning', RUNNING: 'badge-info', QUEUED: 'badge-info',
    PENDING: 'badge-purple', SYNCING: 'badge-info',
    ERROR: 'badge-error', FAILED: 'badge-error', DISCONNECTED: 'badge-error',
    CANCELLED: 'badge-warning', RETRYING: 'badge-warning',
    SUSPENDED: 'badge-warning', DELETED: 'badge-error',
  };
  return colors[status] || 'badge-info';
}
