import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { RenderIf } from '@/components/common/render-if';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-fg-2 px-1 text-sm font-medium">
        {label}
      </label>
      {children}
      <RenderIf
        shouldRender={error}
        fallback={
          <RenderIf shouldRender={hint}>
            <p id={`${id}-hint`} className="text-fg-3 px-1 text-xs leading-relaxed">
              {hint}
            </p>
          </RenderIf>
        }
      >
        <p id={`${id}-error`} className="text-danger flex items-start gap-1.5 px-1 text-[13px]">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      </RenderIf>
    </div>
  );
}
