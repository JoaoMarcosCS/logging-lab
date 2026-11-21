import { useMutation, useQueryClient } from '@tanstack/react-query';
import { boardTasksQueryKey, moveTaskInCache } from '../cache/tasks-cache';
import type { PublicTask, WorkStatus } from '../interface/task.interface';
import { updateTaskRequest } from '../service/update-task.request';
import { useRefreshBoardTasks } from './use-refresh-board-tasks';

interface MoveTaskVariables {
  task: PublicTask;
  workStatus: WorkStatus;
}

export function useMoveTaskMutation(boardId: string) {
  const queryClient = useQueryClient();
  const { refreshTasks, handleNotFound } = useRefreshBoardTasks(boardId);

  return useMutation({
    mutationFn: ({ task, workStatus }: MoveTaskVariables) =>
      updateTaskRequest(boardId, task.id, { workStatus }),
    onMutate: async ({ task, workStatus }) => {
      await queryClient.cancelQueries({ queryKey: boardTasksQueryKey(boardId) });
      const snapshot = queryClient.getQueriesData({ queryKey: boardTasksQueryKey(boardId) });
      moveTaskInCache(queryClient, { ...task, workStatus });
      return { snapshot };
    },
    onError: (error, _variables, context) => {
      context?.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      handleNotFound(error);
    },
    onSettled: () => refreshTasks(),
  });
}
