// ──────────────────────────────────────────
// Shared TypeScript Types
// YouTube Multi-Channel Management Platform
// ──────────────────────────────────────────

// ── User Types ──
export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── Google Account Types ──
export type AccountStatusType = 'ACTIVE' | 'EXPIRED' | 'DISCONNECTED' | 'ERROR';

export interface GoogleAccountSummary {
  id: string;
  googleId: string;
  email: string;
  displayName: string;
  profilePicture: string | null;
  status: AccountStatusType;
  channelCount: number;
  connectedAt: string;
  lastSyncedAt: string | null;
}

// ── Channel Types ──
export type ChannelStatusType = 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'SYNCING';

export interface ChannelSummary {
  id: string;
  youtubeId: string;
  title: string;
  handle: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  country: string | null;
  language: string | null;
  isBrandAccount: boolean;
  isFavorite: boolean;
  tags: string[];
  status: ChannelStatusType;
  googleAccountEmail: string;
  googleAccountId: string;
  groupNames: string[];
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface ChannelFilters {
  search?: string;
  status?: ChannelStatusType;
  googleAccountId?: string;
  groupId?: string;
  isFavorite?: boolean;
  country?: string;
  tags?: string[];
  sortBy?: 'title' | 'subscriberCount' | 'videoCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ── Group Types ──
export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  channelCount: number;
  createdAt: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  channelIds?: string[];
}

// ── Job Types ──
export type JobTypeEnum =
  | 'CHANNEL_SYNC'
  | 'BULK_OPERATION'
  | 'TOKEN_REFRESH'
  | 'ANALYTICS_UPDATE'
  | 'NOTIFICATION_SEND'
  | 'DATA_CLEANUP';

export type JobStatusEnum =
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETRYING';

export interface JobSummary {
  id: string;
  type: JobTypeEnum;
  status: JobStatusEnum;
  progress: number;
  channelTitle: string | null;
  errorMessage: string | null;
  attempts: number;
  maxAttempts: number;
  executionTime: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

// ── Notification Types ──
export type NotificationTypeEnum =
  | 'OAUTH_EXPIRED'
  | 'OAUTH_REFRESHED'
  | 'SYNC_COMPLETE'
  | 'SYNC_FAILED'
  | 'OPERATION_COMPLETE'
  | 'OPERATION_FAILED'
  | 'ACCOUNT_CONNECTED'
  | 'ACCOUNT_DISCONNECTED'
  | 'SYSTEM';

export interface NotificationSummary {
  id: string;
  type: NotificationTypeEnum;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ── Analytics Types ──
export interface DashboardStats {
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

export interface AnalyticsData {
  operationsOverTime: { date: string; completed: number; failed: number }[];
  channelsByAccount: { account: string; count: number }[];
  subscriberDistribution: { range: string; count: number }[];
  jobStatusBreakdown: { status: string; count: number }[];
  recentOperationRate: number;
  avgExecutionTime: number;
  oauthHealthScore: number;
  queueDepth: number;
}

// ── Activity / Audit Types ──
export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  status: string;
  executionTimeMs: number | null;
  createdAt: string;
}

// ── Settings Types ──
export interface UserSettings {
  theme: string;
  timezone: string;
  language: string;
  defaultView: string;
  defaultSort: string;
  notifyEmail: boolean;
  notifyInApp: boolean;
  notifyWebhook: boolean;
  webhookUrl: string | null;
  apiRateLimit: number;
  autoSyncInterval: number;
}

// ── API Response Types ──
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
