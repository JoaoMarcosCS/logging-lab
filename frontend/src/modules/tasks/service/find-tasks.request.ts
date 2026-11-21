import type { Priority, PublicTask, WorkStatus } from '../interface/task.interface';
import { api } from '@/lib/api';
import type { Paginated } from '@/lib/paginated';

interface FindTasksParams {
  workStatus?: WorkStatus;
  priority?: Priority;
  cursor?: string;
  limit?: number;
}

export async function findTasksRequest(
  boardId: string,
  params: FindTasksParams,
): Promise<Paginated<PublicTask>> {
  const { data } = await api.get<Paginated<PublicTask>>(`/boards/${boardId}/tasks`, { params });
  return data;
}
