import { api } from '@/lib/api';

export async function deleteMeRequest(): Promise<void> {
  await api.delete('/users/me');
}
