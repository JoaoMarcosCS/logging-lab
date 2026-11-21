import { publicApi } from '@/lib/public-api';

export async function refreshRequest(): Promise<void> {
  await publicApi.post('/auth/refresh');
}
