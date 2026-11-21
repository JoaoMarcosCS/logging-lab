'use client';

import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import { WORK_STATUSES, WORK_STATUS_LABELS } from '../display/task-display';
import { useDeleteTaskMutation } from '../hooks/use-delete-task-mutation';
import { useSaveTaskForm } from '../hooks/use-save-task-form';
import type { PublicTask } from '../interface/task.interface';
import { PriorityPicker } from './priority-picker';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';
import { RenderItems } from '@/components/common/render-items';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { fieldControlClassName, Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDate } from '@/lib/format-date';
import { cn } from '@/lib/utils';

interface TaskDialogProps {
  boardId: string;
  task?: PublicTask;
  onClose: () => void;
}

export function TaskDialog({ boardId, task, onClose }: TaskDialogProps) {
  const { form, onSubmit, isPending, formError } = useSaveTaskForm({
    boardId,
    task,
    onSaved: onClose,
  });
  const deletion = useDeleteTaskMutation(boardId, onClose);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { errors } = form.formState;
  const busy = isPending || deletion.isPending;

  const close = () => {
    if (!busy) onClose();
  };

  return (
    <Dialog
      open
      title={task ? 'Editar tarefa' : 'Nova tarefa'}
      description={
        task
          ? `Criada em ${formatDate(task.createdAt)}`
          : 'Toda tarefa nova começa em Aguardando início.'
      }
      onClose={close}
      className="max-w-lg"
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={formError} />
        <Field id="task-title" label="Título" error={errors.title?.message}>
          <Input
            id="task-title"
            autoFocus
            maxLength={255}
            aria-invalid={!!errors.title}
            aria-describedby="task-title-error"
            {...form.register('title')}
          />
        </Field>
        <Field
          id="task-description"
          label="Descrição"
          error={errors.description?.message}
          hint="Opcional, até 2000 caracteres."
        >
          <Textarea
            id="task-description"
            maxLength={2000}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? 'task-description-error' : 'task-description-hint'
            }
            {...form.register('description')}
          />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span id="task-priority-label" className="text-fg-2 px-1 text-sm font-medium">
            Prioridade
          </span>
          <Controller
            control={form.control}
            name="priority"
            render={({ field, fieldState }) => (
              <PriorityPicker
                value={field.value}
                onChange={field.onChange}
                invalid={!!fieldState.error}
              />
            )}
          />
          <RenderIf shouldRender={errors.priority}>
            <p className="text-danger px-1 text-[13px]">{errors.priority?.message}</p>
          </RenderIf>
        </div>
        <RenderIf shouldRender={task}>
          <Field id="task-status" label="Etapa" error={errors.workStatus?.message}>
            <select
              id="task-status"
              className={cn(fieldControlClassName, 'h-12 cursor-pointer')}
              {...form.register('workStatus', { valueAsNumber: true })}
            >
              <RenderItems items={WORK_STATUSES} getKey={(status) => status}>
                {(status) => <option value={status}>{WORK_STATUS_LABELS[status]}</option>}
              </RenderItems>
            </select>
          </Field>
        </RenderIf>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <RenderIf shouldRender={task} fallback={<span />}>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              className="text-danger hover:bg-danger-soft"
              onClick={() => {
                deletion.reset();
                setConfirmingDelete(true);
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              Excluir
            </Button>
          </RenderIf>
          <div className="flex gap-2">
            <Button variant="outline" disabled={busy} onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" variant="cta" disabled={busy}>
              <RenderIf shouldRender={isPending} fallback={task ? 'Salvar' : 'Criar tarefa'}>
                <Spinner className="size-4" />
                Salvando
              </RenderIf>
            </Button>
          </div>
        </div>
      </form>
      <RenderIf shouldRender={task}>
        <ConfirmDialog
          open={confirmingDelete}
          tone="danger"
          title="Excluir esta tarefa?"
          description="A exclusão é definitiva e não tem como desfazer."
          confirmLabel="Excluir tarefa"
          isPending={deletion.isPending}
          error={deletion.isError ? getApiErrorMessage(deletion.error) : null}
          onConfirm={() => task && deletion.mutate(task.id)}
          onCancel={() => setConfirmingDelete(false)}
        />
      </RenderIf>
    </Dialog>
  );
}
