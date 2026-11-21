'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useLogout } from '../hooks/use-logout';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useResetOnHide } from '@/hooks/use-reset-on-hide';

export function LogoutButton() {
  const logout = useLogout();
  const [confirming, setConfirming] = useState(false);

  useResetOnHide(() => {
    setConfirming(false);
    logout.reset();
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sair"
        title="Sair"
        disabled={logout.isPending}
        onClick={() => setConfirming(true)}
      >
        <LogOut className="size-4" />
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Sair da conta?"
        description="Você vai precisar entrar de novo com e-mail e senha neste navegador."
        confirmLabel="Sair"
        isPending={logout.isPending}
        onConfirm={() => logout.mutate()}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
