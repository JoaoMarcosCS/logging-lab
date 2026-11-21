import { useInfiniteQuery } from '@tanstack/react-query';
import { boardsQueryKey } from '../cache/boards-cache';
import { findBoardsRequest } from '../service/find-boards.request';

const BOARDS_PAGE_SIZE = 24;

export function useBoardsQuery() {
  return useInfiniteQuery({
    queryKey: boardsQueryKey,
    queryFn: ({ pageParam }) => findBoardsRequest({ cursor: pageParam, limit: BOARDS_PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
