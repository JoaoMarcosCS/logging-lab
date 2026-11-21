import type { ReactNode } from 'react';
import { RenderIf } from '@/components/common/render-if';

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="animate-fade-up flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="flex max-w-2xl flex-col gap-3">
        <p className="text-eyebrow">{eyebrow}</p>
        <h1 className="text-fg text-[clamp(2rem,1.3rem+2.6vw,3.3rem)] leading-[1.06] font-semibold tracking-[-0.04em] [overflow-wrap:anywhere]">
          {title}
        </h1>
        <RenderIf shouldRender={description}>
          <div className="text-fg-2 max-w-xl text-[15px] leading-relaxed [overflow-wrap:anywhere]">
            {description}
          </div>
        </RenderIf>
      </div>
      <RenderIf shouldRender={actions}>
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      </RenderIf>
    </header>
  );
}
