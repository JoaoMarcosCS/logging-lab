'use client';

import { PRIORITIES, PRIORITY_LABELS } from '../display/task-display';
import type { Priority } from '../interface/task.interface';
import { RenderItems } from '@/components/common/render-items';
import { cn } from '@/lib/utils';

interface PriorityPickerProps {
  value: Priority;
  onChange: (value: Priority) => void;
  invalid?: boolean;
}

export function PriorityPicker({ value, onChange, invalid = false }: PriorityPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby="task-priority-label"
      aria-invalid={invalid}
      className="grid grid-cols-3 gap-2"
    >
      <RenderItems items={PRIORITIES} getKey={(priority) => priority}>
        {(priority) => {
          const active = value === priority;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(priority)}
              className={cn(
                'border-line bg-surface text-fg-2 hover:border-line-strong focus-visible:outline-tiffany-ink h-11 cursor-pointer rounded-2xl border text-sm font-medium transition-[background-color,border-color,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2',
                active && 'bg-night border-transparent text-white hover:border-transparent',
              )}
            >
              {PRIORITY_LABELS[priority]}
            </button>
          );
        }}
      </RenderItems>
    </div>
  );
}
