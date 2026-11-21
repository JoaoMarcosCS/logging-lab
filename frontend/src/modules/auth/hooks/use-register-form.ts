import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { RegisterSchema, type RegisterData } from '../schema/register.schema';
import { useRegisterMutation } from './use-register-mutation';
import { useResetOnHide } from '@/hooks/use-reset-on-hide';
import { applyApiErrors, getApiErrorMessage, getApiStatus } from '@/lib/api-error';

export function useRegisterForm() {
  const mutation = useRegisterMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  useResetOnHide(() => {
    form.reset();
    mutation.reset();
    setFormError(null);
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    mutation.mutate(values, {
      onError: (error) => {
        if (getApiStatus(error) === 409) {
          form.setError('email', { message: getApiErrorMessage(error) });
          return;
        }
        setFormError(applyApiErrors(error, form.setError, ['name', 'email', 'password']));
      },
    });
  });

  return {
    form,
    onSubmit,
    isPending: mutation.isPending || mutation.isSuccess,
    formError,
  };
}
