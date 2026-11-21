import type { UpdatePasswordData } from '../schema/update-password.schema';
import { api } from '@/lib/api';

type UpdatePasswordBody = Omit<UpdatePasswordData, 'confirmPassword'>;

export async function updatePasswordRequest(body: UpdatePasswordBody): Promise<void> {
  await api.patch('/users/me/password', body);
}
