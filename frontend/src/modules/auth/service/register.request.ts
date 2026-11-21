import type { RegisterData } from '../schema/register.schema';
import { publicApi } from '@/lib/public-api';
import type { PublicUser } from '@/modules/users/interface/user.interface';

export async function registerRequest(body: RegisterData): Promise<PublicUser> {
  const { data } = await publicApi.post<PublicUser>('/users', body);
  return data;
}
