import { PRIORITY_BADGES, PRIORITY_LABELS } from '../display/task-display';
import type { Priority } from '../interface/task.interface';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold tracking-[0.01em]',
        PRIORITY_BADGES[priority],
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
