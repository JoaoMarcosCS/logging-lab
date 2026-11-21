'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CircleAlert, Pencil, SearchX, Trash2 } from 'lucide-react';
import { useBoardQuery } from '../hooks/use-board-query';
import { useDeleteBoardMutation } from '../hooks/use-delete-board-mutation';
import { BoardDialog } from './board-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { RenderIf } from '@/components/common/render-if';
import { PageHeader } from '@/components/layout/page-header';
import { Button, buttonClassName } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { useResetOnHide } from '@/hooks/use-reset-on-hide';
import { getApiErrorMessage, getApiStatus } from '@/lib/api-error';
import { TaskBoard } from '@/modules/tasks/components/task-board';

const NOT_FOUND_STATUSES = [400, 404];

export function BoardView() {
  const { id } = useParams<{ id: string }>();
  const query = useBoardQuery(id);
  const deletion = useDeleteBoardMutation(id);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const board = query.data;

  useResetOnHide(() => {
    setEditing(false);
    setConfirmingDelete(false);
  });

  const backLink = (
    <Link href="/boards" className={buttonClassName({ variant: 'outline', size: 'sm' })}>
      <ArrowLeft className="size-4" aria-hidden />
      Voltar para os boards
    </Link>
  );

  if (query.isPending) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="text-tiffany-ink size-6" />
      </div>
    );
  }

  if (query.isError || !board) {
    const status = getApiStatus(query.error);
    const notFound = status !== undefined && NOT_FOUND_STATUSES.includes(status);
    return (
      <EmptyState
        icon={notFound ? SearchX : CircleAlert}
        title={notFound ? 'Board não encontrado' : getApiErrorMessage(query.error)}
        description={
          notFound ? 'Ele pode ter sido excluído. Volte para a lista e escolha outro.' : undefined
        }
        action={
          <RenderIf
            shouldRender={notFound}
            fallback={
              <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                Tentar de novo
              </Button>
            }
          >
            {backLink}
          </RenderIf>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/boards"
        className="text-fg-3 hover:text-fg focus-visible:outline-tiffany-ink inline-flex w-fit items-center gap-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Boards
      </Link>
      <PageHeader
        eyebrow="Board"
        title={board.title}
        description={board.description}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger-soft"
              onClick={() => {
                deletion.reset();
                setConfirmingDelete(true);
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              Excluir
            </Button>
          </>
        }
      />
      <TaskBoard boardId={board.id} />
      <RenderIf shouldRender={editing}>
        <BoardDialog
          board={board}
          onClose={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      </RenderIf>
      <ConfirmDialog
        open={confirmingDelete}
        tone="danger"
        title="Excluir o board?"
        description={
          <>
            O board <strong className="text-fg font-semibold">{board.title}</strong> e todas as
            tarefas dele serão excluídos de vez. Não tem como desfazer.
          </>
        }
        confirmLabel="Excluir board"
        isPending={deletion.isPending || deletion.isSuccess}
        error={deletion.isError ? getApiErrorMessage(deletion.error) : null}
        onConfirm={() => deletion.mutate()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
