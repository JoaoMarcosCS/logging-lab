import { api } from '@/lib/api';

export async function deleteBoardRequest(boardId: string): Promise<void> {
  await api.delete(`/boards/${boardId}`);
}
