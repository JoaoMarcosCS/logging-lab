import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { LoginData } from '../schema/login.schema';
import { loginRequest } from '../service/login.request';
import { startSession } from '../session/session';
import { findMeRequest } from '@/modules/users/service/find-me.request';

async function loginAndLoadUser(body: LoginData) {
  await loginRequest(body);
  return findMeRequest();
}

export function useLoginMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: loginAndLoadUser,
    onSuccess: (user) => {
      startSession(user);
      router.replace('/boards');
    },
  });
}
