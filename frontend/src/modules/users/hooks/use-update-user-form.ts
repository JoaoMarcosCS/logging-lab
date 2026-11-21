import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { UpdateUserSchema, type UpdateUserData } from '../schema/update-user.schema';
import { updateMeRequest } from '../service/update-me.request';
import { useResetOnHide } from '@/hooks/use-reset-on-hide';
import { applyApiErrors, getApiErrorMessage, getApiStatus } from '@/lib/api-error';
import { useSessionStore, type SessionUser } from '@/stores/session.store';

function getChanges(values: UpdateUserData, user: SessionUser): Partial<UpdateUserData> {
  const changes: Partial<UpdateUserData> = {};
  if (values.name !== user.name) changes.name = values.name;
  if (values.email.toLowerCase() !== user.email) changes.email = values.email;
  return changes;
}

export function useUpdateUserForm(user: SessionUser) {
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<UpdateUserData>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: { name: user.name, email: user.email },
  });

  const mutation = useMutation({ mutationFn: updateMeRequest });

  useResetOnHide(() => {
    form.reset({ name: user.name, email: user.email });
    mutation.reset();
    setFormError(null);
    setSaved(false);
  });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    setSaved(false);

    const changes = getChanges(values, user);
    if (Object.keys(changes).length === 0) {
      setFormError('Nenhuma alteração para salvar');
      return;
    }

    mutation.mutate(changes, {
      onSuccess: (updated) => {
        useSessionStore.getState().setUser(updated);
        form.reset({ name: updated.name, email: updated.email });
        setSaved(true);
      },
      onError: (error) => {
        if (getApiStatus(error) === 409) {
          form.setError('email', { message: getApiErrorMessage(error) });
          return;
        }
        setFormError(applyApiErrors(error, form.setError, ['name', 'email']));
      },
    });
  });

  return { form, onSubmit, isPending: mutation.isPending, formError, saved };
}
