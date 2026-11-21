'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { RenderIf } from '@/components/common/render-if';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, title, description, onClose, children, className }: DialogProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className={cn(
        'border-line bg-surface text-fg backdrop:bg-night/45 open:animate-pop m-auto w-[calc(100%-32px)] max-w-md rounded-[28px] border p-0 shadow-[0_30px_80px_-30px_rgb(10_60_56/0.45)] backdrop:backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 id={`${id}-title`} className="text-xl font-semibold tracking-[-0.03em]">
              {title}
            </h2>
            <RenderIf shouldRender={description}>
              <div className="text-fg-3 text-sm leading-relaxed">{description}</div>
            </RenderIf>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="text-fg-3 hover:bg-fg/5 hover:text-fg focus-visible:outline-tiffany-ink -mt-1 -mr-1 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
