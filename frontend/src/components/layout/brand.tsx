import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandProps {
  tone?: 'light' | 'dark';
}

export function Brand({ tone = 'light' }: BrandProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="card-tiffany text-night flex size-9 items-center justify-center rounded-full">
        <Check className="size-4.5" strokeWidth={3} aria-hidden />
      </span>
      <span
        className={cn(
          'text-[15px] font-semibold tracking-[-0.02em]',
          tone === 'dark' ? 'text-white' : 'text-fg',
        )}
      >
        Task <span className={tone === 'dark' ? 'text-tiffany' : 'text-tiffany-ink'}>Flow</span>
      </span>
    </span>
  );
}
