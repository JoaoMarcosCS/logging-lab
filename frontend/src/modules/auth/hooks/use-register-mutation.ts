import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { RegisterData } from '../schema/register.schema';
import { loginRequest } from '../service/login.request';
import { registerRequest } from '../service/register.request';
import { startSession } from '../session/session';
import { findMeRequest } from '@/modules/users/service/find-me.request';

async function registerAndLogin(body: RegisterData) {
  await registerRequest(body);
  await loginRequest({ email: body.email, password: body.password });
  return findMeRequest();
}

export function useRegisterMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: registerAndLogin,
    onSuccess: (user) => {
      startSession(user);
      router.replace('/boards');
    },
  });
}
