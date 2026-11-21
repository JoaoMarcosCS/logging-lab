'use client';

import { PRIORITIES, PRIORITY_LABELS } from '../display/task-display';
import type { Priority } from '../interface/task.interface';
import { useTaskFiltersStore, usePriorityFilter } from '../store/task-filters.store';
import { RenderItems } from '@/components/common/render-items';
import { cn } from '@/lib/utils';

interface PriorityFilterProps {
  boardId: string;
}

const OPTIONS: { value: Priority | null; label: string }[] = [
  { value: null, label: 'Todas' },
  ...PRIORITIES.map((value) => ({ value, label: PRIORITY_LABELS[value] })),
];

export function PriorityFilter({ boardId }: PriorityFilterProps) {
  const selected = usePriorityFilter(boardId);
  const setPriority = useTaskFiltersStore((state) => state.setPriority);

  return (
    <div
      role="radiogroup"
      aria-label="Filtrar por prioridade"
      className="border-line-soft bg-surface flex items-center gap-1 rounded-full border p-1"
    >
      <RenderItems items={OPTIONS} getKey={(option) => option.label}>
        {({ value, label }) => {
          const active = selected === value;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPriority(boardId, value)}
              className={cn(
                'text-fg-3 hover:text-fg focus-visible:outline-tiffany-ink h-8 cursor-pointer rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-2',
                active && 'bg-night text-white hover:text-white',
              )}
            >
              {label}
            </button>
          );
        }}
      </RenderItems>
    </div>
  );
}
