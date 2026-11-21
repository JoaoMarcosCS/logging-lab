import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { RenderIf } from './render-if';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <span className="card-tiffany text-night flex size-14 items-center justify-center rounded-full">
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <p className="text-fg text-lg font-semibold tracking-[-0.02em]">{title}</p>
        <RenderIf shouldRender={description}>
          <p className="text-fg-3 text-[15px] leading-relaxed">{description}</p>
        </RenderIf>
      </div>
      {action}
    </div>
  );
}
