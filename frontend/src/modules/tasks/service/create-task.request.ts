import type { Priority, PublicTask } from '../interface/task.interface';
import { api } from '@/lib/api';

export interface CreateTaskBody {
  title: string;
  description?: string | null;
  priority: Priority;
}

export async function createTaskRequest(
  boardId: string,
  body: CreateTaskBody,
): Promise<PublicTask> {
  const { data } = await api.post<PublicTask>(`/boards/${boardId}/tasks`, body);
  return data;
}
