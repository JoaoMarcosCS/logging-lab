'use client';

import { forwardRef, type HTMLAttributes, type KeyboardEventHandler, type ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import type { PublicTask, WorkStatus } from '../interface/task.interface';
import { MoveTaskSelect } from './move-task-select';
import { PriorityBadge } from './priority-badge';
import { RenderIf } from '@/components/common/render-if';
import { cn } from '@/lib/utils';

interface TaskCardFrameProps extends HTMLAttributes<HTMLElement> {
  task: PublicTask;
  handle?: ReactNode;
  footer?: ReactNode;
  onOpen?: (task: PublicTask) => void;
}

export const TaskCardFrame = forwardRef<HTMLElement, TaskCardFrameProps>(function TaskCardFrame(
  { task, handle, footer, onOpen, className, ...props },
  ref,
) {
  return (
    <article
      ref={ref}
      className={cn(
        'group border-line-soft bg-surface ease-out-soft hover:border-tiffany/60 relative flex flex-col gap-3 rounded-[20px] border p-4 shadow-[0_1px_0_rgb(8_30_28/0.04)] transition-[border-color,box-shadow,opacity] duration-300 hover:shadow-[0_22px_44px_-28px_rgb(20_140_128/0.6)]',
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onOpen?.(task)}
          className="focus-visible:outline-tiffany-ink flex min-w-0 flex-1 cursor-pointer flex-col gap-1.5 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <span className="text-fg text-[15px] leading-snug font-semibold tracking-[-0.01em] [overflow-wrap:anywhere]">
            {task.title}
          </span>
          <RenderIf shouldRender={task.description}>
            <span className="text-fg-3 line-clamp-2 text-[13px] leading-relaxed [overflow-wrap:anywhere]">
              {task.description}
            </span>
          </RenderIf>
        </button>
        {handle}
      </div>
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {footer}
      </div>
    </article>
  );
});

interface TaskCardProps {
  task: PublicTask;
  isMoving: boolean;
  onOpen: (task: PublicTask) => void;
  onMove: (task: PublicTask, workStatus: WorkStatus) => void;
}

export function TaskCard({ task, isMoving, onOpen, onMove }: TaskCardProps) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });
  const { onKeyDown, ...pointerListeners } = listeners ?? {};

  return (
    <TaskCardFrame
      ref={setNodeRef}
      task={task}
      onOpen={onOpen}
      className={cn('cursor-grab touch-manipulation', isDragging && 'opacity-35')}
      {...pointerListeners}
      handle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          onKeyDown={onKeyDown as KeyboardEventHandler<HTMLButtonElement> | undefined}
          {...attributes}
          aria-label={`Arrastar a tarefa ${task.title}`}
          className="text-fg-4 hover:bg-fg/5 hover:text-fg-2 focus-visible:outline-tiffany-ink -mt-1 -mr-2 flex size-8 shrink-0 cursor-grab items-center justify-center rounded-full opacity-100 transition-[opacity,color,background-color] duration-200 focus-visible:opacity-100 focus-visible:outline-2 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      }
      footer={
        <MoveTaskSelect
          value={task.workStatus}
          disabled={isMoving}
          label={`Mover a tarefa ${task.title}`}
          onChange={(workStatus) => onMove(task, workStatus)}
        />
      }
    />
  );
}
