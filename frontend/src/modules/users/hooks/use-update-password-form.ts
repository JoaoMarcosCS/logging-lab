import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { UpdatePasswordSchema, type UpdatePasswordData } from '../schema/update-password.schema';
import { updatePasswordRequest } from '../service/update-password.request';
import { useResetOnHide } from '@/hooks/use-reset-on-hide';
import { applyApiErrors, getApiErrorMessage } from '@/lib/api-error';
import { useEndSession } from '@/modules/auth/hooks/use-end-session';

const INVALID_CURRENT_PASSWORD = 'Senha atual incorreta';
const PASSWORD_CHANGED_NOTICE = 'Senha alterada. Entre de novo com a nova senha.';

export function useUpdatePasswordForm() {
  const endSession = useEndSession();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<UpdatePasswordData>({
    resolver: zodResolver(UpdatePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: updatePasswordRequest,
    onSuccess: () => endSession(PASSWORD_CHANGED_NOTICE),
  });

  useResetOnHide(() => {
    form.reset();
    mutation.reset();
    setFormError(null);
  });

  const onSubmit = form.handleSubmit(({ currentPassword, newPassword }) => {
    setFormError(null);
    mutation.mutate(
      { currentPassword, newPassword },
      {
        onError: (error) => {
          if (getApiErrorMessage(error) === INVALID_CURRENT_PASSWORD) {
            form.setError('currentPassword', { message: INVALID_CURRENT_PASSWORD });
            return;
          }
          setFormError(applyApiErrors(error, form.setError, ['currentPassword', 'newPassword']));
        },
      },
    );
  });

  return { form, onSubmit, isPending: mutation.isPending || mutation.isSuccess, formError };
}
