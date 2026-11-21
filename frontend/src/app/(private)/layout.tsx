import { AppShell } from '@/components/layout/app-shell';
import { SessionGate } from '@/modules/auth/components/session-gate';

export default function PrivateLayout({ children }: LayoutProps<'/'>) {
  return (
    <SessionGate>
      <AppShell>{children}</AppShell>
    </SessionGate>
  );
}
