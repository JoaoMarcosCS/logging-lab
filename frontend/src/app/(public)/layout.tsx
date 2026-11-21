import { AuthShell } from '@/modules/auth/components/auth-shell';

export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return <AuthShell>{children}</AuthShell>;
}
