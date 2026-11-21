'use client';

import { useSaveBoardForm } from '../hooks/use-save-board-form';
import type { PublicBoard } from '../interface/board.interface';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

interface BoardDialogProps {
  board?: PublicBoard;
  onClose: () => void;
  onSaved: (board: PublicBoard) => void;
}

export function BoardDialog({ board, onClose, onSaved }: BoardDialogProps) {
  const { form, onSubmit, isPending, formError } = useSaveBoardForm({ board, onSaved });
  const { errors } = form.formState;
  const close = () => {
    if (!isPending) onClose();
  };

  return (
    <Dialog
      open
      title={board ? 'Editar board' : 'Novo board'}
      description={board ? undefined : 'Use um board para cada assunto: estudos, trabalho, casa.'}
      onClose={close}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={formError} />
        <Field id="board-title" label="Título" error={errors.title?.message}>
          <Input
            id="board-title"
            autoFocus
            maxLength={100}
            aria-invalid={!!errors.title}
            aria-describedby="board-title-error"
            {...form.register('title')}
          />
        </Field>
        <Field
          id="board-description"
          label="Descrição"
          error={errors.description?.message}
          hint="Opcional, até 500 caracteres."
        >
          <Textarea
            id="board-description"
            maxLength={500}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? 'board-description-error' : 'board-description-hint'
            }
            {...form.register('description')}
          />
        </Field>
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="outline" disabled={isPending} onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" variant="cta" disabled={isPending}>
            <RenderIf shouldRender={isPending} fallback={board ? 'Salvar' : 'Criar board'}>
              <Spinner className="size-4" />
              Salvando
            </RenderIf>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
