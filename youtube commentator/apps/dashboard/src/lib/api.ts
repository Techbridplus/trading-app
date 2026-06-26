const API_BASE = '/api';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('auth') || '{}')?.accessToken
    : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    // Try refresh
    const refreshToken = JSON.parse(localStorage.getItem('auth') || '{}')?.refreshToken;
    if (refreshToken) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const stored = JSON.parse(localStorage.getItem('auth') || '{}');
        stored.accessToken = data.data.accessToken;
        stored.refreshToken = data.data.refreshToken;
        localStorage.setItem('auth', JSON.stringify(stored));
        // Retry
        headers['Authorization'] = `Bearer ${data.data.accessToken}`;
        const retry = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        return retry.json();
      }
    }
    localStorage.removeItem('auth');
    window.location.href = '/login';
  }

  return res.json();
}

// ── Auth ──
export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetchAPI('/auth/me'),
    logout: (refreshToken: string) =>
      fetchAPI('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  },

  // ── Accounts ──
  accounts: {
    list: () => fetchAPI('/accounts'),
    get: (id: string) => fetchAPI(`/accounts/${id}`),
    addMock: (name: string) =>
      fetchAPI('/accounts/mock', { method: 'POST', body: JSON.stringify({ name }) }),
    sync: (id: string) =>
      fetchAPI(`/accounts/${id}/sync`, { method: 'POST' }),
    delete: (id: string) =>
      fetchAPI(`/accounts/${id}`, { method: 'DELETE' }),
  },

  // ── Channels ──
  channels: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI(`/channels${query}`);
    },
    get: (id: string) => fetchAPI(`/channels/${id}`),
    update: (id: string, data: any) =>
      fetchAPI(`/channels/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    bulkFavorite: (channelIds: string[], isFavorite: boolean) =>
      fetchAPI('/channels/bulk/favorite', { method: 'PATCH', body: JSON.stringify({ channelIds, isFavorite }) }),
  },

  // ── Groups ──
  groups: {
    list: () => fetchAPI('/groups'),
    create: (data: any) =>
      fetchAPI('/groups', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchAPI(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    addChannels: (id: string, channelIds: string[]) =>
      fetchAPI(`/groups/${id}/channels`, { method: 'POST', body: JSON.stringify({ channelIds }) }),
    delete: (id: string) =>
      fetchAPI(`/groups/${id}`, { method: 'DELETE' }),
  },

  // ── Jobs ──
  jobs: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI(`/jobs${query}`);
    },
    get: (id: string) => fetchAPI(`/jobs/${id}`),
  },

  // ── Notifications ──
  notifications: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI(`/notifications${query}`);
    },
    markRead: (id: string) =>
      fetchAPI(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () =>
      fetchAPI('/notifications/read-all', { method: 'PATCH' }),
  },

  // ── Analytics ──
  analytics: {
    dashboard: () => fetchAPI('/analytics'),
    activity: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI(`/analytics/activity${query}`);
    },
  },

  // ── Settings ──
  settings: {
    get: () => fetchAPI('/settings'),
    update: (data: any) =>
      fetchAPI('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
};
