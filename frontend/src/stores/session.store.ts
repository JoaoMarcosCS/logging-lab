import { create } from 'zustand';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export type SessionStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface SessionStore {
  status: SessionStatus;
  user: SessionUser | null;
  notice: string | null;
  setUser: (user: SessionUser) => void;
  clearSession: (notice?: string | null) => void;
  dismissNotice: () => void;
}

export const useSessionStore = create<SessionStore>()((set) => ({
  status: 'unknown',
  user: null,
  notice: null,
  setUser: ({ id, name, email }) =>
    set({ status: 'authenticated', user: { id, name, email }, notice: null }),
  clearSession: (notice = null) => set({ status: 'unauthenticated', user: null, notice }),
  dismissNotice: () => set({ notice: null }),
}));
