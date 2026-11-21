'use client';

import { useState } from 'react';
import { useDeleteMeMutation } from '../hooks/use-delete-me-mutation';
import { ProfileSection } from './profile-section';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useResetOnHide } from '@/hooks/use-reset-on-hide';
import { getApiErrorMessage } from '@/lib/api-error';

export function DeleteAccountSection() {
  const mutation = useDeleteMeMutation();
  const [confirming, setConfirming] = useState(false);

  useResetOnHide(() => {
    setConfirming(false);
    mutation.reset();
  });

  const open = () => {
    mutation.reset();
    setConfirming(true);
  };

  return (
    <ProfileSection
      id="delete-account-title"
      title="Excluir conta"
      description="A exclusão é definitiva. Seus boards e tarefas ficam inacessíveis e o e-mail continua reservado."
      tone="danger"
    >
      <div className="flex flex-col items-start gap-4">
        <p className="text-fg-2 text-sm leading-relaxed">
          Não existe reativação. Se quiser voltar depois, vai precisar de outro e-mail.
        </p>
        <Button variant="outline" className="border-danger/30 text-danger" onClick={open}>
          Excluir minha conta
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        tone="danger"
        title="Excluir a conta de vez?"
        description="Essa ação não pode ser desfeita. Todas as sessões são encerradas, seus boards e tarefas somem e o e-mail fica reservado."
        confirmLabel="Excluir conta"
        isPending={mutation.isPending || mutation.isSuccess}
        error={mutation.isError ? getApiErrorMessage(mutation.error) : null}
        onConfirm={() => mutation.mutate()}
        onCancel={() => setConfirming(false)}
      />
    </ProfileSection>
  );
}
