import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LoginSchema, type LoginData } from '../schema/login.schema';
import { useLoginMutation } from './use-login-mutation';
import { useResetOnHide } from '@/hooks/use-reset-on-hide';
import { applyApiErrors } from '@/lib/api-error';

export function useLoginForm() {
  const mutation = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  useResetOnHide(() => {
    form.reset();
    mutation.reset();
    setFormError(null);
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    mutation.mutate(values, {
      onError: (error) => setFormError(applyApiErrors(error, form.setError, ['email', 'password'])),
    });
  });

  return {
    form,
    onSubmit,
    isPending: mutation.isPending || mutation.isSuccess,
    formError,
  };
}
