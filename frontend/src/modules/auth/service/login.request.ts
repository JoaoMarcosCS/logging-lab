import type { LoginData } from '../schema/login.schema';
import { publicApi } from '@/lib/public-api';

export async function loginRequest(body: LoginData): Promise<void> {
  await publicApi.post('/auth/login', body);
}
