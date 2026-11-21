import type { QueryClient } from '@tanstack/react-query';
import type { Priority, PublicTask, WorkStatus } from '../interface/task.interface';
import type { InfinitePages, Paginated } from '@/lib/paginated';

export const boardTasksQueryKey = (boardId: string) => ['tasks', boardId] as const;

export const tasksQueryKey = (boardId: string, workStatus: WorkStatus, priority: Priority | null) =>
  ['tasks', boardId, workStatus, priority ?? 'all'] as const;

type TasksQueryKey = ReturnType<typeof tasksQueryKey>;

function acceptsTask(queryKey: TasksQueryKey, task: PublicTask): boolean {
  const [, , workStatus, priority] = queryKey;
  return workStatus === task.workStatus && (priority === 'all' || priority === task.priority);
}

function insertSorted(pages: Paginated<PublicTask>[], task: PublicTask): Paginated<PublicTask>[] {
  const pageIndex = pages.findIndex((page) => page.data.some((item) => item.id < task.id));

  if (pageIndex === -1) {
    const last = pages.length - 1;
    if (last < 0 || pages[last].nextCursor !== null) return pages;
    return pages.map((page, index) =>
      index === last ? { ...page, data: [...page.data, task] } : page,
    );
  }

  return pages.map((page, index) => {
    if (index !== pageIndex) return page;
    const position = page.data.findIndex((item) => item.id < task.id);
    return { ...page, data: [...page.data.slice(0, position), task, ...page.data.slice(position)] };
  });
}

export function moveTaskInCache(queryClient: QueryClient, task: PublicTask) {
  const queries = queryClient.getQueriesData<InfinitePages<PublicTask>>({
    queryKey: boardTasksQueryKey(task.boardId),
  });

  for (const [queryKey, data] of queries) {
    if (!data) continue;

    const pages = data.pages.map((page) => ({
      ...page,
      data: page.data.filter((item) => item.id !== task.id),
    }));
    const next = acceptsTask(queryKey as TasksQueryKey, task) ? insertSorted(pages, task) : pages;

    queryClient.setQueryData<InfinitePages<PublicTask>>(queryKey, { ...data, pages: next });
  }
}
