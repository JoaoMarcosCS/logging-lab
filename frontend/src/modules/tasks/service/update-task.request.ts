import type { Priority, PublicTask, WorkStatus } from '../interface/task.interface';
import { api } from '@/lib/api';

export interface UpdateTaskBody {
  title?: string;
  description?: string | null;
  priority?: Priority;
  workStatus?: WorkStatus;
}

export async function updateTaskRequest(
  boardId: string,
  taskId: string,
  body: UpdateTaskBody,
): Promise<PublicTask> {
  const { data } = await api.patch<PublicTask>(`/boards/${boardId}/tasks/${taskId}`, body);
  return data;
}
