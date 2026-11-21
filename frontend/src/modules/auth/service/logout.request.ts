import { api } from '@/lib/api';

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout');
}
