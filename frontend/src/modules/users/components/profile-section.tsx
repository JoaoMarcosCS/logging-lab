import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ProfileSectionProps {
  id: string;
  title: string;
  description: string;
  tone?: 'default' | 'danger';
  children: ReactNode;
}

export function ProfileSection({
  id,
  title,
  description,
  tone = 'default',
  children,
}: ProfileSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'bg-surface grid gap-6 rounded-[28px] border p-6 sm:p-8 md:grid-cols-[minmax(0,280px)_1fr] md:gap-10',
        tone === 'danger' ? 'border-danger/20' : 'border-line-soft',
      )}
    >
      <div className="flex flex-col gap-2">
        <h2
          id={id}
          className={cn(
            'text-xl font-semibold tracking-[-0.03em]',
            tone === 'danger' ? 'text-danger' : 'text-fg',
          )}
        >
          {title}
        </h2>
        <p className="text-fg-3 text-sm leading-relaxed">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
