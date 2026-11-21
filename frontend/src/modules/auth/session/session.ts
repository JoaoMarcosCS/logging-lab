import { refreshRequest } from '../service/refresh.request';
import { clearSessionCookie, setSessionCookie } from './session-cookie';
import { getApiStatus } from '@/lib/api-error';
import { findMeRequest } from '@/modules/users/service/find-me.request';
import { useSessionStore, type SessionUser } from '@/stores/session.store';

const REFRESH_LOCK = 'task-flow.refresh';

let pendingRefresh: Promise<void> | null = null;

export function startSession(user: SessionUser) {
  useSessionStore.getState().setUser(user);
  setSessionCookie();
}

export function endSession(notice: string | null = null) {
  useSessionStore.getState().clearSession(notice);
  clearSessionCookie();
}

export async function restoreSession() {
  const user = await findMeRequest();
  startSession(user);
}

async function runRefresh(): Promise<void> {
  try {
    await navigator.locks.request(REFRESH_LOCK, refreshRequest);
  } catch (error) {
    if (getApiStatus(error) === 401) endSession();
    throw error;
  }
}

export function refreshSession(): Promise<void> {
  pendingRefresh ??= runRefresh().finally(() => {
    pendingRefresh = null;
  });

  return pendingRefresh;
}
