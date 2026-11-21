import type { PublicBoard } from '../interface/board.interface';
import { api } from '@/lib/api';

export interface CreateBoardBody {
  title: string;
  description?: string | null;
}

export async function createBoardRequest(body: CreateBoardBody): Promise<PublicBoard> {
  const { data } = await api.post<PublicBoard>('/boards', body);
  return data;
}
