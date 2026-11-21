'use client';

import { useLoginForm } from '../hooks/use-login-form';
import { FormError } from '@/components/common/form-error';
import { Notice } from '@/components/common/notice';
import { RenderIf } from '@/components/common/render-if';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { useSessionStore } from '@/stores/session.store';

export function LoginForm() {
  const { form, onSubmit, isPending, formError } = useLoginForm();
  const notice = useSessionStore((state) => state.notice);
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Notice message={notice} />
      <FormError message={formError} />
      <Field id="email" label="E-mail" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="voce@email.com"
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
          {...form.register('email')}
        />
      </Field>
      <Field id="password" label="Senha" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby="password-error"
          {...form.register('password')}
        />
      </Field>
      <Button type="submit" variant="cta" size="lg" arrow disabled={isPending} className="mt-2">
        <RenderIf shouldRender={isPending} fallback="Entrar">
          <Spinner className="size-4" />
          Entrando
        </RenderIf>
      </Button>
    </form>
  );
}
