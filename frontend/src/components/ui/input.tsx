import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const fieldControlClassName =
  'w-full rounded-2xl border border-line bg-surface px-4 text-[15px] text-fg transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-fg-4 focus:border-tiffany-ink focus:ring-4 focus:ring-tiffany/35 aria-invalid:border-danger aria-invalid:focus:ring-danger/15';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldControlClassName, 'h-12', className)} {...props} />;
}
