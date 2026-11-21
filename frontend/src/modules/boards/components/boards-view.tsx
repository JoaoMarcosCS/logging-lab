'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CircleAlert, LayoutGrid } from 'lucide-react';
import { useBoardsQuery } from '../hooks/use-boards-query';
import { BoardCard } from './board-card';
import { BoardDialog } from './board-dialog';
import { NewBoardTile } from './new-board-tile';
import { EmptyState } from '@/components/common/empty-state';
import { InfiniteScrollTrigger } from '@/components/common/infinite-scroll-trigger';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useResetOnHide } from '@/hooks/use-reset-on-hide';
import { getApiErrorMessage } from '@/lib/api-error';
import { getFirstName, getGreeting } from '@/lib/format-date';
import { flattenPages } from '@/lib/paginated';
import { useSessionStore } from '@/stores/session.store';

export function BoardsView() {
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const [creating, setCreating] = useState(false);
  const query = useBoardsQuery();
  const boards = flattenPages(query.data);
  const openCreate = () => setCreating(true);

  useResetOnHide(() => setCreating(false));

  const renderFallback = () => {
    if (query.isPending) {
      return (
        <div className="flex justify-center py-20">
          <Spinner className="text-tiffany-ink size-6" />
        </div>
      );
    }
    if (query.isError) {
      return (
        <EmptyState
          icon={CircleAlert}
          title={getApiErrorMessage(query.error)}
          action={
            <Button variant="outline" size="sm" onClick={() => query.refetch()}>
              Tentar de novo
            </Button>
          }
        />
      );
    }
    return (
      <div className="border-line-strong bg-surface/60 rounded-[32px] border border-dashed">
        <EmptyState
          icon={LayoutGrid}
          title="Nenhum board ainda"
          description="Crie o primeiro para começar a organizar suas tarefas."
          action={
            <Button variant="cta" arrow onClick={openCreate}>
              Criar board
            </Button>
          }
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow={`${getGreeting()}, ${getFirstName(user?.name ?? '')}`}
        title={
          <>
            Seus <span className="text-tiffany-ink">boards</span>
          </>
        }
        description="Cada board guarda as tarefas de um assunto. Abra um para mover as tarefas entre as etapas."
        actions={
          <Button variant="cta" size="lg" arrow onClick={openCreate}>
            Novo board
          </Button>
        }
      />
      <RenderIf shouldRender={boards.length > 0} fallback={renderFallback()}>
        <ul className="animate-fade-up grid grid-cols-1 gap-4 [animation-delay:80ms] sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <NewBoardTile onClick={openCreate} />
          </li>
          <RenderItems items={boards} getKey={(board) => board.id}>
            {(board) => (
              <li>
                <BoardCard board={board} />
              </li>
            )}
          </RenderItems>
        </ul>
        <InfiniteScrollTrigger
          hasNextPage={query.hasNextPage}
          isFetching={query.isFetchingNextPage}
          onLoadMore={() => query.fetchNextPage()}
        />
      </RenderIf>
      <RenderIf shouldRender={creating}>
        <BoardDialog
          onClose={() => setCreating(false)}
          onSaved={(board) => {
            setCreating(false);
            router.push(`/boards/${board.id}`);
          }}
        />
      </RenderIf>
    </div>
  );
}
