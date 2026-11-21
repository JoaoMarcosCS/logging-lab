import type { ComponentProps } from 'react';
import { fieldControlClassName } from './input';
import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(fieldControlClassName, 'min-h-28 resize-y py-3 leading-relaxed', className)}
      {...props}
    />
  );
}
