export const CACHE_TTL_SECONDS = 300;

export type TaskListKeyParams = {
  limit: number;
  cursor?: string;
  workStatus?: number;
  priority?: number;
};

export const cacheKeys = {
  boardsOfUser: (userId: string) => `cache:boards:${userId}:`,
  boardsPage: (userId: string, limit: number, cursor?: string) =>
    `cache:boards:${userId}:${limit}:${cursor ?? 'first'}`,
  board: (boardId: string) => `cache:board:${boardId}`,
  tasksOfBoard: (boardId: string) => `cache:board:${boardId}:tasks:`,
  tasksPage: (boardId: string, params: TaskListKeyParams) =>
    `cache:board:${boardId}:tasks:${params.limit}:${params.cursor ?? 'first'}:${params.workStatus ?? 'all'}:${params.priority ?? 'all'}`,
  task: (boardId: string, taskId: string) =>
    `cache:board:${boardId}:task:${taskId}`,
};
