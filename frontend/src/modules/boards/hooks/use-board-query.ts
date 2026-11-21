import { useQuery } from '@tanstack/react-query';
import { boardQueryKey } from '../cache/boards-cache';
import { findBoardRequest } from '../service/find-board.request';

export function useBoardQuery(boardId: string) {
  return useQuery({
    queryKey: boardQueryKey(boardId),
    queryFn: () => findBoardRequest(boardId),
  });
}
