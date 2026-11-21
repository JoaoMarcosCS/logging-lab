import type { PublicBoard } from '../interface/board.interface';
import { api } from '@/lib/api';

export interface UpdateBoardBody {
  title?: string;
  description?: string | null;
}

export async function updateBoardRequest(
  boardId: string,
  body: UpdateBoardBody,
): Promise<PublicBoard> {
  const { data } = await api.patch<PublicBoard>(`/boards/${boardId}`, body);
  return data;
}
