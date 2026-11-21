'use client';

import type { ReactNode } from 'react';
import { Button } from './button';
import { Dialog } from './dialog';
import { Spinner } from './spinner';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  isPending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'primary',
  isPending = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancel = () => {
    if (!isPending) onCancel();
  };

  return (
    <Dialog open={open} title={title} description={description} onClose={cancel}>
      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" disabled={isPending} onClick={cancel}>
          {cancelLabel}
        </Button>
        <Button variant={tone} size="sm" autoFocus disabled={isPending} onClick={onConfirm}>
          <RenderIf shouldRender={isPending} fallback={confirmLabel}>
            <Spinner className="size-4" />
          </RenderIf>
        </Button>
      </div>
    </Dialog>
  );
}
