import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { boardTasksQueryKey } from '../cache/tasks-cache';
import { getApiStatus } from '@/lib/api-error';
import { boardQueryKey } from '@/modules/boards/cache/boards-cache';

export function useRefreshBoardTasks(boardId: string) {
  const queryClient = useQueryClient();

  const refreshTasks = useCallback(
    () => queryClient.invalidateQueries({ queryKey: boardTasksQueryKey(boardId) }),
    [queryClient, boardId],
  );

  const handleNotFound = useCallback(
    (error: unknown) => {
      if (getApiStatus(error) !== 404) return;
      void refreshTasks();
      void queryClient.invalidateQueries({ queryKey: boardQueryKey(boardId) });
    },
    [queryClient, boardId, refreshTasks],
  );

  return { refreshTasks, handleNotFound };
}
