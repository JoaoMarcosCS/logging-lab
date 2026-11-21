import Link from 'next/link';
import { AuthCard } from '@/modules/auth/components/auth-card';
import { RegisterForm } from '@/modules/auth/components/register-form';

export default function RegisterPage() {
  return (
    <AuthCard
      eyebrow="Criar conta"
      title="Comece seu primeiro board"
      footer={
        <>
          Já tem conta?{' '}
          <Link href="/login" className="text-tiffany-ink font-semibold hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
