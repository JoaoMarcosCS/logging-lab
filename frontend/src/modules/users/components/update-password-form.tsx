'use client';

import { useUpdatePasswordForm } from '../hooks/use-update-password-form';
import { FormError } from '@/components/common/form-error';
import { RenderIf } from '@/components/common/render-if';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { PASSWORD_HINT } from '@/modules/auth/schema/register.schema';

export function UpdatePasswordForm() {
  const { form, onSubmit, isPending, formError } = useUpdatePasswordForm();
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={formError} />
      <Field id="currentPassword" label="Senha atual" error={errors.currentPassword?.message}>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          aria-invalid={!!errors.currentPassword}
          aria-describedby="currentPassword-error"
          {...form.register('currentPassword')}
        />
      </Field>
      <Field
        id="newPassword"
        label="Nova senha"
        error={errors.newPassword?.message}
        hint={PASSWORD_HINT}
      >
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          aria-invalid={!!errors.newPassword}
          aria-describedby={errors.newPassword ? 'newPassword-error' : 'newPassword-hint'}
          {...form.register('newPassword')}
        />
      </Field>
      <Field
        id="confirmPassword"
        label="Repita a nova senha"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby="confirmPassword-error"
          {...form.register('confirmPassword')}
        />
      </Field>
      <Button type="submit" disabled={isPending} className="mt-1 self-start">
        <RenderIf shouldRender={isPending} fallback="Trocar senha">
          <Spinner className="size-4" />
          Trocando
        </RenderIf>
      </Button>
    </form>
  );
}
