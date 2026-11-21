import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { boardQueryKey, boardsQueryKey } from '../cache/boards-cache';
import { deleteBoardRequest } from '../service/delete-board.request';
import { boardTasksQueryKey } from '@/modules/tasks/cache/tasks-cache';

export function useDeleteBoardMutation(boardId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteBoardRequest(boardId),
    onSuccess: () => {
      router.replace('/boards');
      queryClient.removeQueries({ queryKey: boardQueryKey(boardId) });
      queryClient.removeQueries({ queryKey: boardTasksQueryKey(boardId) });
      void queryClient.invalidateQueries({ queryKey: boardsQueryKey });
    },
  });
}
