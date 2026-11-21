import { api } from '@/lib/api';

export async function deleteTaskRequest(boardId: string, taskId: string): Promise<void> {
  await api.delete(`/boards/${boardId}/tasks/${taskId}`);
}
