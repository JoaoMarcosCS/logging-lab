'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { WORK_STATUSES, WORK_STATUS_LABELS } from '../display/task-display';
import { useMoveTaskMutation } from '../hooks/use-move-task-mutation';
import { WorkStatus, type PublicTask } from '../interface/task.interface';
import { usePriorityFilter } from '../store/task-filters.store';
import { PriorityFilter } from './priority-filter';
import { TaskCardFrame } from './task-card';
import { TaskColumn } from './task-column';
import { TaskDialog } from './task-dialog';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { Button } from '@/components/ui/button';
import { useResetOnHide } from '@/hooks/use-reset-on-hide';
import { getApiErrorMessage } from '@/lib/api-error';

type DialogState = { mode: 'create' } | { mode: 'edit'; task: PublicTask } | null;

function getDraggedTask(data: { current?: Record<string, unknown> } | undefined) {
  return data?.current?.task as PublicTask | undefined;
}

function getDropStatus(data: { current?: Record<string, unknown> } | undefined) {
  return data?.current?.workStatus as WorkStatus | undefined;
}

const announcements: Announcements = {
  onDragStart: ({ active }) => `Tarefa ${getDraggedTask(active.data)?.title ?? ''} selecionada.`,
  onDragOver: ({ over }) => {
    const status = getDropStatus(over?.data);
    return status === undefined
      ? 'Fora das colunas.'
      : `Sobre a coluna ${WORK_STATUS_LABELS[status]}.`;
  },
  onDragEnd: ({ active, over }) => {
    const status = getDropStatus(over?.data);
    const title = getDraggedTask(active.data)?.title ?? '';
    return status === undefined
      ? `Tarefa ${title} solta fora das colunas.`
      : `Tarefa ${title} movida para ${WORK_STATUS_LABELS[status]}.`;
  },
  onDragCancel: ({ active }) =>
    `Movimento da tarefa ${getDraggedTask(active.data)?.title ?? ''} cancelado.`,
};

const screenReaderInstructions = {
  draggable:
    'Para mover a tarefa, pressione espaço ou enter. Use as setas para escolher a coluna e pressione espaço ou enter de novo para soltar. Esc cancela.',
};

interface TaskBoardProps {
  boardId: string;
}

export function TaskBoard({ boardId }: TaskBoardProps) {
  const priority = usePriorityFilter(boardId);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [draggedTask, setDraggedTask] = useState<PublicTask | null>(null);
  const move = useMoveTaskMutation(boardId);
  const openCreate = () => setDialog({ mode: 'create' });

  useResetOnHide(() => {
    setDialog(null);
    setDraggedTask(null);
  });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const moveTask = (task: PublicTask, workStatus: WorkStatus) => {
    if (task.workStatus !== workStatus) move.mutate({ task, workStatus });
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setDraggedTask(getDraggedTask(active.data) ?? null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedTask(null);
    const task = getDraggedTask(active.data);
    const workStatus = getDropStatus(over?.data);
    if (task && workStatus !== undefined) moveTask(task, workStatus);
  };

  return (
    <div className="animate-fade-up flex flex-col gap-4 [animation-delay:80ms]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PriorityFilter boardId={boardId} />
        <Button variant="cta" arrow onClick={openCreate}>
          Nova tarefa
        </Button>
      </div>
      <FormError message={move.isError ? getApiErrorMessage(move.error) : null} />
      <DndContext
        sensors={sensors}
        accessibility={{ announcements, screenReaderInstructions }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDraggedTask(null)}
      >
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-5 sm:px-5 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          <RenderItems items={WORK_STATUSES} getKey={(status) => status}>
            {(status) => (
              <TaskColumn
                boardId={boardId}
                workStatus={status}
                priority={priority}
                movingTaskId={move.isPending ? move.variables.task.id : null}
                onOpen={(task) => setDialog({ mode: 'edit', task })}
                onMove={moveTask}
                action={
                  <RenderIf shouldRender={status === WorkStatus.AWAITING_START}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Nova tarefa"
                      title="Nova tarefa"
                      onClick={openCreate}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </RenderIf>
                }
              />
            )}
          </RenderItems>
        </div>
        {createPortal(
          <DragOverlay dropAnimation={null}>
            <RenderIf shouldRender={draggedTask}>
              {draggedTask && (
                <TaskCardFrame
                  task={draggedTask}
                  className="border-tiffany h-full rotate-2 cursor-grabbing shadow-[0_30px_60px_-24px_rgb(20_140_128/0.65)]"
                />
              )}
            </RenderIf>
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
      <RenderIf shouldRender={dialog}>
        <TaskDialog
          key={dialog?.mode === 'edit' ? dialog.task.id : 'create'}
          boardId={boardId}
          task={dialog?.mode === 'edit' ? dialog.task : undefined}
          onClose={() => setDialog(null)}
        />
      </RenderIf>
    </div>
  );
}
