import type { PublicBoard } from '../interface/board.interface';
import { api } from '@/lib/api';
import type { Paginated } from '@/lib/paginated';

interface FindBoardsParams {
  cursor?: string;
  limit?: number;
}

export async function findBoardsRequest(params: FindBoardsParams): Promise<Paginated<PublicBoard>> {
  const { data } = await api.get<Paginated<PublicBoard>>('/boards', { params });
  return data;
}
