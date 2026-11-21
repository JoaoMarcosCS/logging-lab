import type { PublicUser } from '../interface/user.interface';
import { api } from '@/lib/api';

export async function findMeRequest(): Promise<PublicUser> {
  const { data } = await api.get<PublicUser>('/users/me');
  return data;
}
