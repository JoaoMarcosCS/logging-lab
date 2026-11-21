import { useMutation } from '@tanstack/react-query';
import { deleteMeRequest } from '../service/delete-me.request';
import { useEndSession } from '@/modules/auth/hooks/use-end-session';

const ACCOUNT_DELETED_NOTICE = 'Sua conta foi excluída.';

export function useDeleteMeMutation() {
  const endSession = useEndSession();

  return useMutation({
    mutationFn: deleteMeRequest,
    onSuccess: () => endSession(ACCOUNT_DELETED_NOTICE),
  });
}
