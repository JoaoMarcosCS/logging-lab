import type { PublicUser } from '../interface/user.interface';
import type { UpdateUserData } from '../schema/update-user.schema';
import { api } from '@/lib/api';

export async function updateMeRequest(body: Partial<UpdateUserData>): Promise<PublicUser> {
  const { data } = await api.patch<PublicUser>('/users/me', body);
  return data;
}
