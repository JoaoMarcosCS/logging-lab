import type { PublicBoard } from '../interface/board.interface';
import { api } from '@/lib/api';

export async function findBoardRequest(boardId: string): Promise<PublicBoard> {
  const { data } = await api.get<PublicBoard>(`/boards/${boardId}`);
  return data;
}
