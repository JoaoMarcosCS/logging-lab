import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { endSession } from '../session/session';

export function useEndSession() {
  const queryClient = useQueryClient();

  return useCallback(
    (notice: string | null = null) => {
      endSession(notice);
      queryClient.clear();
    },
    [queryClient],
  );
}
