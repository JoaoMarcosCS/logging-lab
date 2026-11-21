import { useInfiniteQuery } from '@tanstack/react-query';
import { tasksQueryKey } from '../cache/tasks-cache';
import type { Priority, WorkStatus } from '../interface/task.interface';
import { findTasksRequest } from '../service/find-tasks.request';

const TASKS_PAGE_SIZE = 20;

export function useTasksQuery(boardId: string, workStatus: WorkStatus, priority: Priority | null) {
  return useInfiniteQuery({
    queryKey: tasksQueryKey(boardId, workStatus, priority),
    queryFn: ({ pageParam }) =>
      findTasksRequest(boardId, {
        workStatus,
        priority: priority ?? undefined,
        cursor: pageParam,
        limit: TASKS_PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
