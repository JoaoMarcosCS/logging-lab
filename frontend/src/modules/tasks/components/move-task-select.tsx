'use client';

import { ChevronDown } from 'lucide-react';
import { WORK_STATUSES, WORK_STATUS_LABELS } from '../display/task-display';
import type { WorkStatus } from '../interface/task.interface';
import { RenderItems } from '@/components/common/render-items';

interface MoveTaskSelectProps {
  value: WorkStatus;
  disabled?: boolean;
  label: string;
  onChange: (value: WorkStatus) => void;
}

export function MoveTaskSelect({ value, disabled, label, onChange }: MoveTaskSelectProps) {
  return (
    <label
      className="relative inline-flex"
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <span className="sr-only">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value) as WorkStatus)}
        className="border-line-soft bg-mist text-fg-2 hover:border-line-strong focus-visible:border-tiffany-ink focus-visible:ring-tiffany/35 h-8 cursor-pointer appearance-none rounded-full border pr-8 pl-3 text-xs font-medium transition-colors duration-200 outline-none focus-visible:ring-4 disabled:opacity-50"
      >
        <RenderItems items={WORK_STATUSES} getKey={(status) => status}>
          {(status) => <option value={status}>{WORK_STATUS_LABELS[status]}</option>}
        </RenderItems>
      </select>
      <ChevronDown
        className="text-fg-3 pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2"
        aria-hidden
      />
    </label>
  );
}
