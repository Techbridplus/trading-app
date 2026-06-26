import { create } from 'zustand';

// ── Auth Store ──
interface AuthState {
  user: { id: string; email: string; name: string; role: string; avatarUrl?: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthState['user'], accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Hydrate from localStorage on init
  let initialUser = null;
  let initialAccessToken = null;
  let initialRefreshToken = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        initialUser = parsed.user;
        initialAccessToken = parsed.accessToken;
        initialRefreshToken = parsed.refreshToken;
      }
    } catch {}
  }

  return {
    user: initialUser,
    accessToken: initialAccessToken,
    refreshToken: initialRefreshToken,
    isAuthenticated: !!initialAccessToken,
    setAuth: (user, accessToken, refreshToken) => {
      localStorage.setItem('auth', JSON.stringify({ user, accessToken, refreshToken }));
      set({ user, accessToken, refreshToken, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('auth');
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    },
  };
});

// ── Sidebar Store ──
interface SidebarState {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
}));

// ── Global Search Store ──
interface SearchState {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  query: '',
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: '' }),
  setQuery: (query) => set({ query }),
}));
