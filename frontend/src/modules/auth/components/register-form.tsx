'use client';

import { useRegisterForm } from '../hooks/use-register-form';
import { PASSWORD_HINT } from '../schema/register.schema';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';

export function RegisterForm() {
  const { form, onSubmit, isPending, formError } = useRegisterForm();
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={formError} />
      <Field id="name" label="Nome" error={errors.name?.message}>
        <Input
          id="name"
          autoComplete="name"
          autoFocus
          aria-invalid={!!errors.name}
          aria-describedby="name-error"
          {...form.register('name')}
        />
      </Field>
      <Field id="email" label="E-mail" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
          {...form.register('email')}
        />
      </Field>
      <Field id="password" label="Senha" error={errors.password?.message} hint={PASSWORD_HINT}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : 'password-hint'}
          {...form.register('password')}
        />
      </Field>
      <Button type="submit" variant="cta" size="lg" arrow disabled={isPending} className="mt-2">
        <RenderIf shouldRender={isPending} fallback="Criar conta">
          <Spinner className="size-4" />
          Criando conta
        </RenderIf>
      </Button>
    </form>
  );
}
