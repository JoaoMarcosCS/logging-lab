'use client';

import { useUpdateUserForm } from '../hooks/use-update-user-form';
import { FormError } from '@/components/common/form-error';
import { Notice } from '@/components/common/notice';
import { RenderIf } from '@/components/common/render-if';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { SessionUser } from '@/stores/session.store';

interface UpdateUserFormProps {
  user: SessionUser;
}

export function UpdateUserForm({ user }: UpdateUserFormProps) {
  const { form, onSubmit, isPending, formError, saved } = useUpdateUserForm(user);
  const { errors, isDirty } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={formError} />
      <Notice message={saved && !isDirty ? 'Dados atualizados.' : null} />
      <Field id="name" label="Nome" error={errors.name?.message}>
        <Input
          id="name"
          autoComplete="name"
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
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
          {...form.register('email')}
        />
      </Field>
      <Button type="submit" disabled={!isDirty || isPending} className="mt-1 self-start">
        <RenderIf shouldRender={isPending} fallback="Salvar dados">
          <Spinner className="size-4" />
          Salvando
        </RenderIf>
      </Button>
    </form>
  );
}
