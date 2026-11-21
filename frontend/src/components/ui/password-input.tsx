'use client';

import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './input';
import { RenderIf } from '@/components/common/render-if';
import { cn } from '@/lib/utils';

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'>;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Esconder senha' : 'Mostrar senha';

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-12', className)} {...props} />
      <button
        type="button"
        aria-label={label}
        aria-pressed={visible}
        title={label}
        onClick={() => setVisible((value) => !value)}
        className="text-fg-3 hover:text-fg focus-visible:outline-tiffany-ink absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center rounded-r-2xl transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <RenderIf shouldRender={visible} fallback={<Eye className="size-4" />}>
          <EyeOff className="size-4" />
        </RenderIf>
      </button>
    </div>
  );
}
