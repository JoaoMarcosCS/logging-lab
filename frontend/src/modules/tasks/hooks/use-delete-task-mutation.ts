import { useMutation } from '@tanstack/react-query';
import { deleteTaskRequest } from '../service/delete-task.request';
import { useRefreshBoardTasks } from './use-refresh-board-tasks';

export function useDeleteTaskMutation(boardId: string, onDeleted: () => void) {
  const { refreshTasks, handleNotFound } = useRefreshBoardTasks(boardId);

  return useMutation({
    mutationFn: (taskId: string) => deleteTaskRequest(boardId, taskId),
    onSuccess: () => {
      void refreshTasks();
      onDeleted();
    },
    onError: handleNotFound,
  });
}
