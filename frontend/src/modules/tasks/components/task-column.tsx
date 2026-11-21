'use client';

import type { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CircleAlert } from 'lucide-react';
import { WORK_STATUS_DOTS, WORK_STATUS_LABELS } from '../display/task-display';
import { useTasksQuery } from '../hooks/use-tasks-query';
import type { Priority, PublicTask, WorkStatus } from '../interface/task.interface';
import { TaskCard } from './task-card';
import { InfiniteScrollTrigger } from '@/components/common/infinite-scroll-trigger';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getApiErrorMessage } from '@/lib/api-error';
import { flattenPages } from '@/lib/paginated';
import { cn } from '@/lib/utils';

export function getColumnId(workStatus: WorkStatus): string {
  return `column-${workStatus}`;
}

interface TaskColumnProps {
  boardId: string;
  workStatus: WorkStatus;
  priority: Priority | null;
  movingTaskId: string | null;
  action?: ReactNode;
  onOpen: (task: PublicTask) => void;
  onMove: (task: PublicTask, workStatus: WorkStatus) => void;
}

export function TaskColumn({
  boardId,
  workStatus,
  priority,
  movingTaskId,
  action,
  onOpen,
  onMove,
}: TaskColumnProps) {
  const query = useTasksQuery(boardId, workStatus, priority);
  const tasks = flattenPages(query.data);
  const titleId = `${getColumnId(workStatus)}-title`;
  const { setNodeRef, isOver, active } = useDroppable({
    id: getColumnId(workStatus),
    data: { workStatus },
  });
  const draggedTask = active?.data.current?.task as PublicTask | undefined;
  const isTarget = !!draggedTask && draggedTask.workStatus !== workStatus;

  const renderFallback = () => {
    if (query.isPending) {
      return (
        <div className="flex justify-center py-8">
          <Spinner className="text-tiffany-ink" />
        </div>
      );
    }
    if (query.isError) {
      return (
        <div className="flex flex-col items-center gap-3 px-3 py-8 text-center">
          <p className="text-danger flex items-start gap-1.5 text-[13px]">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {getApiErrorMessage(query.error)}
          </p>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Tentar de novo
          </Button>
        </div>
      );
    }
    return (
      <p
        className={cn(
          'border-line text-fg-3 rounded-[20px] border border-dashed px-4 py-8 text-center text-[13px] transition-colors duration-200',
          isTarget && 'border-tiffany-ink/40 text-tiffany-deep',
        )}
      >
        <RenderIf shouldRender={isTarget} fallback="Nenhuma tarefa aqui.">
          Solte aqui para mover
        </RenderIf>
      </p>
    );
  };

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={titleId}
      className={cn(
        'border-line-soft bg-mist ease-out-soft flex w-[85vw] max-w-[340px] shrink-0 snap-start flex-col gap-3 rounded-[28px] border p-3 transition-[background-color,border-color,box-shadow] duration-200 lg:w-auto lg:max-w-none',
        isTarget && 'border-tiffany-ink/30 border-dashed',
        isTarget &&
          isOver &&
          'border-tiffany bg-tiffany-soft/70 ring-tiffany/30 border-solid ring-4',
      )}
    >
      <header className="flex h-10 items-center justify-between gap-2 pr-1 pl-2">
        <h2 id={titleId} className="text-fg flex items-center gap-2.5 text-sm font-semibold">
          <span aria-hidden className={cn('size-2 rounded-full', WORK_STATUS_DOTS[workStatus])} />
          {WORK_STATUS_LABELS[workStatus]}
        </h2>
        {action}
      </header>
      <div className="flex max-h-[calc(100dvh-19rem)] min-h-32 flex-col gap-2.5 overflow-y-auto overscroll-contain px-0.5 pb-1">
        <RenderIf shouldRender={tasks.length > 0} fallback={renderFallback()}>
          <RenderItems items={tasks} getKey={(task) => task.id}>
            {(task) => (
              <TaskCard
                task={task}
                isMoving={movingTaskId === task.id}
                onOpen={onOpen}
                onMove={onMove}
              />
            )}
          </RenderItems>
          <InfiniteScrollTrigger
            hasNextPage={query.hasNextPage}
            isFetching={query.isFetchingNextPage}
            onLoadMore={() => query.fetchNextPage()}
          />
        </RenderIf>
      </div>
    </section>
  );
}
