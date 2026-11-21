import Link from 'next/link';
import { AuthCard } from '@/modules/auth/components/auth-card';
import { LoginForm } from '@/modules/auth/components/login-form';

export default function LoginPage() {
  return (
    <AuthCard
      eyebrow="Entrar"
      title="Bom te ver de novo"
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link href="/register" className="text-tiffany-ink font-semibold hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
