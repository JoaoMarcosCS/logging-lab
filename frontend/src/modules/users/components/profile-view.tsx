'use client';

import { DeleteAccountSection } from './delete-account-section';
import { ProfileSection } from './profile-section';
import { UpdatePasswordForm } from './update-password-form';
import { UpdateUserForm } from './update-user-form';
import { RenderIf } from '@/components/common/render-if';
import { PageHeader } from '@/components/layout/page-header';
import { useSessionStore } from '@/stores/session.store';

export function ProfileView() {
  const user = useSessionStore((state) => state.user);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Perfil"
        title={
          <>
            Sua <span className="text-tiffany-ink">conta</span>
          </>
        }
        description="Atualize seus dados de acesso. Trocar a senha encerra a sessão em todos os dispositivos."
      />
      <div className="animate-fade-up flex flex-col gap-4 [animation-delay:80ms]">
        <ProfileSection
          id="user-data-title"
          title="Dados"
          description="Nome e e-mail usados para entrar no Task Flow."
        >
          <RenderIf shouldRender={user}>
            {user && <UpdateUserForm key={user.id} user={user} />}
          </RenderIf>
        </ProfileSection>
        <ProfileSection
          id="password-title"
          title="Senha"
          description="Depois da troca, você entra de novo com a nova senha."
        >
          <UpdatePasswordForm />
        </ProfileSection>
        <DeleteAccountSection />
      </div>
    </div>
  );
}
